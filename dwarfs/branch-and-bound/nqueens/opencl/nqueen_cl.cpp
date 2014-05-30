// N-queen solver for OpenCL
// Ping-Che Chen
// adapted for OpenDwarfs


#include <fstream>
#include <sstream>
#include <ctime>
#include <cstdlib>
#include <cstring>
#include "nqueen_cl.h"
#include "common_args.h"

//#define CHECK_ERROR(err) { if(err != CL_SUCCESS) throw CLError(err, __LINE__); }

cl_event ocdTempEvent;
class CLMemAutoRelease
{
public:

	CLMemAutoRelease(cl_mem mem) : m_Mem(mem) {}
	~CLMemAutoRelease() { clReleaseMemObject(m_Mem); }

private:
	
	cl_mem m_Mem;
};


class CLEventAutoRelease
{
public:

	CLEventAutoRelease(cl_event ev) : m_Event(ev) {}
	~CLEventAutoRelease() { clReleaseEvent(m_Event); }

private:
	
	cl_event m_Event;
};


NQueenSolver::NQueenSolver(cl_context context, std::vector<cl_device_id> devices, bool profiling, int threads, int block_size, bool force_local, bool force_no_atomics, bool force_no_vec, bool force_vec4) :
	m_Context(context), m_bProfiling(profiling), m_bForceLocal(force_local), m_bForceNoAtomics(force_no_atomics), m_bForceNoVectorization(force_no_vec), m_bForceVec4(force_vec4)
{
	cl_int err;

	err = clRetainContext(m_Context);
	CHECK_ERROR(err);

	if(devices.empty()) { //For OpenDwarfs this will never happen, will have failed earlier.
		// query device
		size_t size;
		err = clGetContextInfo(m_Context, CL_CONTEXT_DEVICES, 0, 0, &size);
		CHECK_ERROR(err);

		std::vector<cl_device_id> devices(size / sizeof(cl_device_id));
		err = clGetContextInfo(m_Context, CL_CONTEXT_DEVICES, size, &devices[0], 0);
		CHECK_ERROR(err);
		printf("Should not get in here\n");
		m_Devices.push_back(devices[0]);
	}
	else {
		m_Devices = devices;
	}

	m_bDoubleQueue = false;

	m_SolverInfo.resize(m_bDoubleQueue ? m_Devices.size() * 2 : m_Devices.size()); //by default will be of size 1 (since m_bDoubleQueue is false and m_Devices.size() will return 1.
	//So, only one solver instance.
	
	cl_device_type type;
	for(int i = 0; i < m_SolverInfo.size(); i++) { //For OpenDwarfs will only iterate once.
		
		cl_device_id device = m_Devices[i % m_Devices.size()];
		err = clGetDeviceInfo(device, CL_DEVICE_TYPE, sizeof(type), &type, 0);
		CHECK_ERROR(err);

		m_SolverInfo[i].m_bCPU = ((type & CL_DEVICE_TYPE_CPU) != 0);
		m_SolverInfo[i].m_nThreads = threads;

		InitKernels(i, block_size);

		//m_SolverInfo[i].m_Queue = clCreateCommandQueue(m_Context, device, m_bProfiling ? CL_QUEUE_PROFILING_ENABLE : 0, &err);
		m_SolverInfo[i].m_Queue = commands; //This has been initialized by ocd_initCL();
		//CHECK_ERROR(err);
	}
}


NQueenSolver::~NQueenSolver()
{
	if(m_Context != 0) {
		clReleaseContext(m_Context);
	}
}


void NQueenSolver::InitKernels(int i, int block_size)
{
	cl_uint vector_width;
	cl_int err;
	cl_device_id device = m_Devices[i % m_Devices.size()];

	err = clGetDeviceInfo(device, CL_DEVICE_PREFERRED_VECTOR_WIDTH_INT, sizeof(vector_width), &vector_width, 0);
	CHECK_ERROR(err);

	if(!m_bForceNoVectorization && !m_SolverInfo[i].m_bCPU && vector_width != 1) {
		m_SolverInfo[i].m_bEnableVectorize = true;
		m_SolverInfo[i].m_bEnableLocal = true;


	}

	size_t max_size;
	err = clGetDeviceInfo(device, CL_DEVICE_MAX_WORK_GROUP_SIZE, sizeof(size_t), &max_size, 0);
	CHECK_ERROR(err);

	size_t length;
	err = clGetDeviceInfo(device, CL_DEVICE_EXTENSIONS, 0, 0, &length);
	CHECK_ERROR(err);

	std::string extensions;
	extensions.resize(length + 1);
	err = clGetDeviceInfo(device, CL_DEVICE_EXTENSIONS, length, &extensions[0], 0);
	CHECK_ERROR(err);

	std::stringstream ext(extensions);
	m_SolverInfo[i].m_bEnableAtomics = false;
	while(!ext.eof()) {
		std::string name;
		ext >> name;
		if(name == "cl_khr_global_int32_base_atomics") {
			m_SolverInfo[i].m_bEnableAtomics = true;
		}
		else if(name == "cl_khr_byte_addressable_store") {
			m_SolverInfo[i].m_bEnableChar = true;
		}
	}

	if(m_bForceNoAtomics || m_SolverInfo[i].m_bCPU) {
		m_SolverInfo[i].m_bEnableAtomics = false;
	}

	// load program
	std::ifstream in("kernels_nqueens.cl");
	in.seekg(0, std::ios_base::end);
	std::ifstream::pos_type size = in.tellg();
	in.seekg(0, std::ios_base::beg);

	std::string buffer;
	buffer.resize(size);
	in.read(&buffer[0], size);

	BuildProgram(i, buffer, vector_width, m_SolverInfo[i].m_bEnableVectorize ? (m_bForceVec4 ? 64 : 128) : 256);

	cl_uint units;
	err = clGetDeviceInfo(device, CL_DEVICE_MAX_COMPUTE_UNITS, sizeof(cl_uint), &units, 0);
	CHECK_ERROR(err);

	err = clGetKernelWorkGroupInfo(m_SolverInfo[i].m_NQueen, device, CL_KERNEL_WORK_GROUP_SIZE, sizeof(size_t), &m_SolverInfo[i].m_nMaxWorkItems, 0);

	CHECK_ERROR(err);

	if(m_SolverInfo[i].m_nMaxWorkItems > 256) {
		m_SolverInfo[i].m_nMaxWorkItems = 256;
	}

	if(block_size != 0) {
		m_SolverInfo[i].m_nMaxWorkItems = block_size * (m_SolverInfo[i].m_bEnableVectorize ? (m_bForceVec4 ? 4 : 2) : 1);
	}

	int block_multiplier = (max_size + 255) / 256;


	if(m_SolverInfo[i].m_nThreads == 0) {

		if(m_SolverInfo[i].m_bEnableAtomics) {
			m_SolverInfo[i].m_nThreads = m_SolverInfo[i].m_nMaxWorkItems * units * (block_multiplier == 1 ? 1 : block_multiplier - 1);
		}
		else if(m_SolverInfo[i].m_bEnableVectorize) {
			m_SolverInfo[i].m_nThreads = m_SolverInfo[i].m_nMaxWorkItems * units * block_multiplier * 2;
		}
		else {
			m_SolverInfo[i].m_nThreads = m_SolverInfo[i].m_nMaxWorkItems * units * block_multiplier * 4;
		}
	}

	if(m_bForceLocal && m_SolverInfo[i].m_nMaxWorkItems < 256) {
		// rebuild program
		if(m_SolverInfo[i].m_NQueen != 0) {
			clReleaseKernel(m_SolverInfo[i].m_NQueen);
		}

		if(m_SolverInfo[i].m_NQueen1 != 0) {
			clReleaseKernel(m_SolverInfo[i].m_NQueen1);
		}

		if(m_SolverInfo[i].m_Program != 0) {
			clReleaseProgram(m_SolverInfo[i].m_Program);
		}

		BuildProgram(i, buffer, vector_width, m_SolverInfo[i].m_bEnableVectorize ? (m_bForceVec4 ? m_SolverInfo[i].m_nMaxWorkItems / 4 : m_SolverInfo[i].m_nMaxWorkItems / 2) : m_SolverInfo[i].m_nMaxWorkItems);

		if(m_SolverInfo[i].m_nThreads % m_SolverInfo[i].m_nMaxWorkItems != 0) {
			m_SolverInfo[i].m_nThreads = (m_SolverInfo[i].m_nThreads / m_SolverInfo[i].m_nMaxWorkItems) * m_SolverInfo[i].m_nMaxWorkItems;
		}
	}
	
}


void printArray(unsigned int *a, int n){
  for(int k = 0; k < n; ++k){
    printf("%u, ", a[k]);
    }
  printf("\n\n\n");
}


void NQueenSolver::BuildProgram(int i, const std::string& program, int vector_width, int work_items)
{
	const char* bufs[1] = { &program[0] };
	size_t lengths[1] = { program.size() };
	cl_int err;
	cl_device_id device = m_Devices[i % m_Devices.size()];

	m_SolverInfo[i].m_Program = clCreateProgramWithSource(m_Context, 1, bufs, lengths, &err);
	CHECK_ERROR(err);

	std::stringstream settings;

	settings << "-D WORK_ITEMS=" << work_items;

	if(m_SolverInfo[i].m_bCPU) {
		settings << " -D FORCE_CPU";
	}
	else if(m_bForceLocal) {
		settings << " -D FORCE_LOCAL";
	}

	if(m_SolverInfo[i].m_bEnableAtomics && !m_SolverInfo[i].m_bCPU) {
		settings << " -D USE_ATOMICS";
	}

	if(m_SolverInfo[i].m_bEnableVectorize) {
		settings << " -D ENABLE_VECTORIZE";

		if(!m_bForceVec4) {
			settings << " -D USE_VEC2";
		}
	}

	if(m_SolverInfo[i].m_bEnableChar) {
		settings << " -D ENABLE_CHAR";
	}

	err = clBuildProgram(m_SolverInfo[i].m_Program, 1, &device, settings.str().c_str(), 0, 0);
	if(err != CL_SUCCESS) {
		size_t param_size;
		clGetProgramBuildInfo(m_SolverInfo[i].m_Program, device, CL_PROGRAM_BUILD_LOG, 0, 0, &param_size);
		std::string log;
		log.resize(param_size);
		clGetProgramBuildInfo(m_SolverInfo[i].m_Program, device, CL_PROGRAM_BUILD_LOG, param_size, &log[0], 0);
		std::cerr << log.c_str() << "\n";
		
		CHECK_ERROR(err);
	}
/*
	cl_uint devices;
	err = clGetProgramInfo(m_Program, CL_PROGRAM_NUM_DEVICES, sizeof(devices), &devices, 0);
	CHECK_ERROR(err);

	std::vector<size_t> binary_size(devices);
	err = clGetProgramInfo(m_Program, CL_PROGRAM_BINARY_SIZES, sizeof(size_t) * devices, &binary_size[0], 0);
	CHECK_ERROR(err);

	std::vector<unsigned char*> binary_pointer(devices);
	std::vector<std::vector<unsigned char> > binary(devices);
	for(size_t i = 0; i < devices; i++) {
		binary[i].resize(binary_size[i]);
		binary_pointer[i] = &binary[i][0];
	}
	err = clGetProgramInfo(m_Program, CL_PROGRAM_BINARIES, sizeof(unsigned char*) * devices, &binary_pointer[0], 0);
	CHECK_ERROR(err);

	std::ofstream out("kernels.bin", std::ios_base::binary);
	out.write(reinterpret_cast<const char*>(&binary[0][0]), binary_size[0]);
*/
	m_SolverInfo[i].m_NQueen = clCreateKernel(m_SolverInfo[i].m_Program, m_SolverInfo[i].m_bEnableVectorize ? "nqueen_vec" : "nqueen", &err);
	CHECK_ERROR(err);

	m_SolverInfo[i].m_NQueen1 = clCreateKernel(m_SolverInfo[i].m_Program, m_SolverInfo[i].m_bEnableVectorize ? "nqueen1_vec": "nqueen1", &err);
	CHECK_ERROR(err);
	
}


inline int bit_scan(unsigned int x)
{
	int res = 0;
	res |= (x & 0xaaaaaaaa) ? 1 : 0;
	res |= (x & 0xcccccccc) ? 2 : 0;
	res |= (x & 0xf0f0f0f0) ? 4 : 0;
	res |= (x & 0xff00ff00) ? 8 : 0;
	res |= (x & 0xffff0000) ? 16 : 0;
	return res;
}

void printM(int *mat, int m, int n){
  int i,j;
  for(i=0;i<m;++i){
    for(j=0;j<n;++j){
      printf("%.4d,", mat[i*n+j]); 
    }
    printf("\n");
  }
}

void printMD(cl_mem a, int m, int n, cl_command_queue queue){
    int *x = (int *)malloc(sizeof(int)*m*n);
    clEnqueueReadBuffer(queue, a, CL_TRUE, 0, sizeof(int)*m*n, x, 0, NULL, NULL); 
    clFinish(queue);
    printM(x, m, n);
    free(x);
}

long long NQueenSolver::Compute(int board_size, long long* unique){
	// estimate amount of levels need to be computed on the device
	long long total = 1000000000LL;
	int level = 0;
	int i = board_size;
  bool enable_atomics = m_SolverInfo[0].m_bEnableAtomics; 
  cl_mem param_d, result_d, forbidden_d, global_index_d; 
  cl_kernel nqueen =  m_SolverInfo[0].m_NQueen ;
  cl_kernel nqueen1 =  m_SolverInfo[0].m_NQueen1;
  cl_command_queue queue = m_SolverInfo[0].m_Queue;
  bool enable_vectorize = m_SolverInfo[0].m_bEnableVectorize;
  int mn_threads = m_SolverInfo[0].m_nThreads;
  int last_total_size =  0;
  size_t n_max_work_items = m_SolverInfo[0].m_nMaxWorkItems;

	while(total > 0 && i > 0) {
		total /= ((i + 1) / 2);
		i--;
		level++;
	}

	if(level > board_size - 2) {
		level = board_size - 2;
	}

	if(level > 11) {
		level = 11;
	}
  int threads = 0; 
	int max_threads = 0;
	int max_pitch;
	cl_int err;

  if(enable_atomics) {
    threads = mn_threads * 16;
  }
  else {
    threads = mn_threads;
  }

  if(max_threads < threads) {
    max_threads = threads;
  }

	max_pitch = (max_threads + 15) & ~0xf;

  // create data buffer
  param_d = clCreateBuffer(m_Context, CL_MEM_READ_ONLY, max_pitch * sizeof(int) * (4 + 32), 0, &err);
  CHECK_ERROR(err);

  result_d = clCreateBuffer(m_Context, CL_MEM_WRITE_ONLY, max_pitch * sizeof(int) * 4, 0, &err);
  CHECK_ERROR(err);

  forbidden_d = clCreateBuffer(m_Context, CL_MEM_READ_ONLY, 32 * sizeof(int), 0, &err);
  CHECK_ERROR(err);

  global_index_d = clCreateBuffer(m_Context, CL_MEM_READ_WRITE, sizeof(int), 0, &err);
  CHECK_ERROR(err);

	std::vector<unsigned int> mask_vector(max_pitch * (4 + 32));
	std::vector<unsigned int> results(max_pitch * 4);
  bool forbidden_written = false;
	long long solutions = 0;
	long long unique_solutions = 0;
	int vec_size = m_bForceVec4 ? 4 : 2;

	unsigned int board_mask = (1 << board_size) - 1;
	int total_size = 0;

	for(int j = 0; j < board_size / 2; j++) {
		unsigned int masks[32];
		unsigned int left_masks[32];
		unsigned int right_masks[32];
		unsigned int ms[32];
		unsigned int ns[32];
		unsigned int forbidden[32];
		unsigned int border_mask = 0;
		int idx = 0;
		int i = 0;
    
    for(int k = 0; k < 32; ++k){
      forbidden[k] = 0;
    }
    
		masks[0] = (1 << j);
		left_masks[0] = 1 << (j + 1);
		right_masks[0] = (1 << j) >> 1;
		ms[0] = masks[0] | left_masks[0] | right_masks[0];
		ns[0] = (1 << j);

		for(int k = 0; k < j; k++) {
			border_mask |= (1 << k);
			border_mask |= (1 << (board_size - k - 1));
		}
      
		for(int k = 0; k < board_size; k++) {
			if(k == board_size - 2) {
				forbidden[k] = border_mask;
			}
			else if((k + 1) < j || (k + 1) > board_size - j - 1) {
				forbidden[k] = 1 | (1 << (board_size - 1));
			}
			else {
				forbidden[k] = 0;
			}
		}
		forbidden[board_size - 1] = 0xffffffff;
    forbidden_written = false;

		while(i >= 0) {
			if(j == 0) {
				if(i >= 1) {
					unsigned int m = ms[i] | (i + 1 < idx ? 2 : 0);
					ns[i + 1] = (m + 1) & ~m;
				}
				else {
					ns[i + 1] = ((ms[i] + 1) & ~ms[i]);
					if(i == 0) {
						idx = bit_scan(ns[i + 1]);
					}
				}
			}
			else {
				unsigned int m = ms[i] | forbidden[i];
				ns[i + 1] = (m + 1) & ~m;
			}

			if(i == board_size - level - 1) {
				mask_vector[total_size] = masks[i];
				mask_vector[total_size + max_pitch] = left_masks[i];
				mask_vector[total_size + max_pitch * 2] = right_masks[i];
				if(j == 0) {
					mask_vector[total_size + max_pitch * 3] = idx - i < 0 ? 0 : idx - i;
				}
				else {
					// check rotation
					mask_vector[total_size + max_pitch * 3] = j;
				}
				for(int k = 0; k <= i; k++) {
					mask_vector[total_size + max_pitch * (k + 4)] = ns[k];
				}
				total_size++;
				if(total_size == max_threads) {
					cl_kernel queen = (j == 0 ? nqueen1: nqueen);
					
					cl_int arg_board_size = board_size;
					cl_int arg_level = level;
					cl_int arg_threads = enable_vectorize ? (threads + vec_size - 1) / vec_size : threads;
					cl_int arg_pitch = enable_vectorize ? max_pitch / vec_size : max_pitch;
					err = clSetKernelArg(queen, 0, sizeof(cl_int), &arg_board_size);
					err |= clSetKernelArg(queen, 1, sizeof(cl_int), &arg_level);
					err |= clSetKernelArg(queen, 2, sizeof(cl_int), &arg_threads);
					err |= clSetKernelArg(queen, 3, sizeof(cl_int), &arg_pitch);
					err |= clSetKernelArg(queen, 4, sizeof(cl_mem), &param_d);
					err |= clSetKernelArg(queen, 5, sizeof(cl_mem), &result_d);
					err |= clSetKernelArg(queen, 6, sizeof(cl_mem), &forbidden_d);
					if(enable_atomics) {
						err |= clSetKernelArg(queen, 7, sizeof(cl_mem), &global_index_d);
					}
					CHECK_ERROR(err);

					if(!forbidden_written) {
						err = clEnqueueWriteBuffer(queue, forbidden_d, CL_TRUE, 0, (level + 1) * sizeof(int), forbidden + board_size - level - 1, 0, 0, NULL);
						clFinish(queue);
						CHKERR(err, "Error in writing m_ForbiddenBuffer");
						forbidden_written = true;
					}

					err = clEnqueueWriteBuffer(queue, param_d, CL_TRUE, 0, max_pitch * sizeof(int) * (4 + 32), &mask_vector[0], 0, 0, NULL);
					clFinish(queue);
					CHKERR(err, "Error in writing m_ParamBuffer");

					size_t work_dim[1] = { enable_vectorize ? mn_threads / vec_size : mn_threads };
					size_t* group_dim = 0;
					size_t n = n_max_work_items / vec_size;
					group_dim = enable_vectorize ? &n : &n_max_work_items;

					int num_threads = work_dim[0];
					if(enable_atomics) {
						err = clEnqueueWriteBuffer(queue, global_index_d, CL_TRUE, 0, sizeof(int), &num_threads, 0, 0, NULL);
						clFinish(queue);
						CHKERR(err, "Error in writing m_GlobalIndex");
					}

					err = clEnqueueNDRangeKernel(queue, queen, 1, 0, work_dim, group_dim, 0, 0, NULL);
                			clFinish(queue);
					CHKERR(err, "Launch kernel error");

					err = clFlush(queue);
					CHECK_ERROR(err);

					last_total_size = threads;

					if(total_size > threads) {
						// adjust the data array
						for(int k = 0; k < 4 + board_size - level; k++) {
							memcpy(&mask_vector[max_pitch * k], &mask_vector[threads+ max_pitch * k], (total_size - threads) * sizeof(int));
						}
					}

					total_size -= threads;
          // get data from the device
          err = clEnqueueReadBuffer(queue, result_d, CL_TRUE, 0, max_pitch * sizeof(int) * 4, &results[0], 0, NULL, NULL);
          clFinish(queue);
          CHKERR(err, "Error in reading m_ResultsBuffer");


          for(int k = 0; k < last_total_size; k++) {
            if(results[k + max_pitch * 2] != results[k + max_pitch * 3]) {
              throw CLError(1);
            }

            solutions += results[k];
            unique_solutions += results[k + max_pitch];
          }
				}

				i--;
			}
			else if((ns[i + 1] & board_mask) != 0) {
				ms[i] |= ns[i + 1];
				masks[i+1] = masks[i] | ns[i + 1];
				left_masks[i+1] = (left_masks[i] | ns[i + 1]) << 1;
				right_masks[i+1] = (right_masks[i] | ns[i + 1]) >> 1;
				ms[i+1] = masks[i+1] | left_masks[i+1] | right_masks[i + 1];
				i++;
			}
			else {
				i--;
			}
		}

		while(total_size > 0) {
			for(int k = total_size; k < max_threads; k++) {
				mask_vector[k] = 0xffffffff;
				mask_vector[k + max_pitch] = 0xffffffff;
				mask_vector[k + max_pitch * 2] = 0xffffffff;
				mask_vector[k + max_pitch * 3] = 0;
				mask_vector[k + max_pitch * 4] = 0;
			}

			cl_kernel queen = (j == 0 ? nqueen1: nqueen);

			cl_int arg_board_size = board_size;
			cl_int arg_level = level;
			int t_size = total_size > threads? threads : total_size;
			cl_int arg_threads = enable_vectorize ? (t_size + vec_size - 1) / vec_size : t_size;
			cl_int arg_pitch = enable_vectorize ? max_pitch / vec_size : max_pitch;

			err = clSetKernelArg(queen, 0, sizeof(cl_int), &arg_board_size);
			err |= clSetKernelArg(queen, 1, sizeof(cl_int), &arg_level);
			err |= clSetKernelArg(queen, 2, sizeof(cl_int), &arg_threads);
			err |= clSetKernelArg(queen, 3, sizeof(cl_int), &arg_pitch);
			err |= clSetKernelArg(queen, 4, sizeof(cl_mem), &param_d);
			err |= clSetKernelArg(queen, 5, sizeof(cl_mem), &result_d);
			err |= clSetKernelArg(queen, 6, sizeof(cl_mem), &forbidden_d);
			if(enable_atomics) {
				err |= clSetKernelArg(queen, 7, sizeof(cl_mem), &global_index_d);
			}
			CHECK_ERROR(err);

			if(!forbidden_written) {
				err = clEnqueueWriteBuffer(queue, forbidden_d, CL_TRUE, 0, (level + 1) * sizeof(int), forbidden + board_size - level - 1, 0, 0, NULL);
				clFinish(queue);
				CHKERR(err, "Error in writing m_ForbiddenBuffer");
				forbidden_written = true;
			}

			err = clEnqueueWriteBuffer(queue, param_d, CL_TRUE, 0, max_pitch * sizeof(int) * (4 + 32), &mask_vector[0], 0, 0, NULL);
			clFinish(queue);
			CHKERR(err, "Error in writing m_ParamBuffer");

			size_t work_dim[1];
			if(t_size < mn_threads) {
				work_dim[0] = enable_vectorize ? (t_size + vec_size - 1) / vec_size : t_size;
			}
			else {
				work_dim[0] = enable_vectorize ? mn_threads / vec_size : mn_threads;
			}
			size_t* group_dim = 0;
			size_t n = enable_vectorize ? n_max_work_items / vec_size : n_max_work_items;
			group_dim = &n;
			if(work_dim[0] % n != 0) {
				work_dim[0] += n - work_dim[0] % n;
			}

			int num_thread = work_dim[0];
			if(enable_atomics) {
				err = clEnqueueWriteBuffer(queue, global_index_d, CL_TRUE, 0, sizeof(int), &num_thread, 0, 0, NULL);
				clFinish(queue);
				CHKERR(err, "Error in writing m_GlobalIndex");
			}

			err = clEnqueueNDRangeKernel(queue, queen, 1, 0, work_dim, group_dim, 0, 0, NULL);
      clFinish(queue);
			CHKERR(err, "Launch kernel error");

			err = clFlush(queue);
			CHECK_ERROR(err);

      last_total_size = t_size;

			if(total_size > t_size) {
				// adjust the data array
				for(int k = 0; k < 4 + board_size - level; k++) {
					memcpy(&mask_vector[max_pitch * k], &mask_vector[t_size + max_pitch * k], (total_size - t_size) * sizeof(int));
				}
			}

			total_size -= t_size;

				// get data from the device
				err = clEnqueueReadBuffer(queue, result_d, CL_TRUE, 0, max_pitch * sizeof(int) * 4, &results[0], 0, NULL, NULL);
				clFinish(queue);
				CHKERR(err, "Error in reading m_ResultsBuffer");

				for(int k = 0; k < last_total_size; k++) {
					if(results[k + max_pitch * 2] != results[k + max_pitch * 3]) {
            printf("k=%d, max_pitch=%d results[%d]=%d results[%d]=%d\n", k, max_pitch, k+max_pitch*2, k+max_pitch*3);
						throw CLError(2);
					}

					solutions += results[k];
					unique_solutions += results[k + max_pitch];
				}
		}
	}

  if(param_d != 0) { clReleaseMemObject(param_d); param_d = 0; }
  if(result_d != 0) { clReleaseMemObject(result_d); result_d = 0; }
  if(forbidden_d != 0) { clReleaseMemObject(forbidden_d); forbidden_d = 0; }
  if(global_index_d != 0) { clReleaseMemObject(global_index_d); global_index_d = 0; }

	if(unique != 0) {
		*unique = unique_solutions;
	}
	return solutions;
}
