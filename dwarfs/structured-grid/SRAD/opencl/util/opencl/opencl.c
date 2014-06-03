#ifdef __cplusplus
extern "C" {
#endif

//===============================================================================================================================================================================================================200
//	INCLUDE/DEFINE
//===============================================================================================================================================================================================================200

#include <stdio.h>					// (in path known to compiler)		needed by printf

#include <CL/cl.h>					// (in path specified to compiler)	needed by OpenCL types

//===============================================================================================================================================================================================================200
//	INCLUDE/DEFINE
//===============================================================================================================================================================================================================200

#include "opencl.h"					// (in directory)	function headers

//===============================================================================================================================================================================================================200
//	LOAD KERNEL SOURCE CODE FUNCTION
//===============================================================================================================================================================================================================200

char *
load_kernel_source(const char *filename)
{
	// Open the source file
	FILE *file = fopen(filename, "r");
	if (file == NULL){
		fatal("Error opening kernel source file\n");
	}

	// Determine the size of the file
	if (fseek(file, 0, SEEK_END)){
		fatal("Error reading kernel source file\n");
	}
	size_t size = ftell(file);

	// Allocate space for the source code (plus one for null-terminator)
	char *source = (char *) malloc(size + 1);

	// Read the source code into the string
	fseek(file, 0, SEEK_SET);
	// fprintf(stderr, "Number of elements: %lu\nSize = %lu", fread(source, 1, size, file), size);
	// exit(1);
	if (fread(source, 1, size, file) != size){
		fatal("Error reading kernel source file\n");
	}

	// Null-terminate the string
	source[size] = '\0';

	// Return the pointer to the string
	return source;
}

//===============================================================================================================================================================================================================200
//	PRINT ERROR FUNCTION
//===============================================================================================================================================================================================================200

void
fatal(const char *s)
{
	fprintf(stderr, "Error: %s\n", s);
	exit(1);
}

//===============================================================================================================================================================================================================200
//	PRINT OPENCL ERROR FUNCTION
//===============================================================================================================================================================================================================200

void
fatal_CL(cl_int error, int line_no) {

	fprintf(stderr, "Error at line %d: ", line_no);

	switch(error) {

		case CL_SUCCESS: 									fprintf(stderr, "CL_SUCCESS\n"); break;
		case CL_DEVICE_NOT_FOUND: 							fprintf(stderr, "CL_DEVICE_NOT_FOUND\n"); break;
		case CL_DEVICE_NOT_AVAILABLE: 						fprintf(stderr, "CL_DEVICE_NOT_AVAILABLE\n"); break;
		case CL_COMPILER_NOT_AVAILABLE: 					fprintf(stderr, "CL_COMPILER_NOT_AVAILABLE\n"); break;
		case CL_MEM_OBJECT_ALLOCATION_FAILURE: 				fprintf(stderr, "CL_MEM_OBJECT_ALLOCATION_FAILURE\n"); break;
		case CL_OUT_OF_RESOURCES: 							fprintf(stderr, "CL_OUT_OF_RESOURCES\n"); break;
		case CL_OUT_OF_HOST_MEMORY: 						fprintf(stderr, "CL_OUT_OF_HOST_MEMORY\n"); break;
		case CL_PROFILING_INFO_NOT_AVAILABLE: 				fprintf(stderr, "CL_PROFILING_INFO_NOT_AVAILABLE\n"); break;
		case CL_MEM_COPY_OVERLAP: 							fprintf(stderr, "CL_MEM_COPY_OVERLAP\n"); break;
		case CL_IMAGE_FORMAT_MISMATCH: 						fprintf(stderr, "CL_IMAGE_FORMAT_MISMATCH\n"); break;
		case CL_IMAGE_FORMAT_NOT_SUPPORTED: 				fprintf(stderr, "CL_IMAGE_FORMAT_NOT_SUPPORTED\n"); break;
		case CL_BUILD_PROGRAM_FAILURE: 						fprintf(stderr, "CL_BUILD_PROGRAM_FAILURE\n"); break;
		case CL_MAP_FAILURE: 								fprintf(stderr, "CL_MAP_FAILURE\n"); break;
		case CL_INVALID_VALUE: 								fprintf(stderr, "CL_INVALID_VALUE\n"); break;
		case CL_INVALID_DEVICE_TYPE: 						fprintf(stderr, "CL_INVALID_DEVICE_TYPE\n"); break;
		case CL_INVALID_PLATFORM: 							fprintf(stderr, "CL_INVALID_PLATFORM\n"); break;
		case CL_INVALID_DEVICE: 							fprintf(stderr, "CL_INVALID_DEVICE\n"); break;
		case CL_INVALID_CONTEXT: 							fprintf(stderr, "CL_INVALID_CONTEXT\n"); break;
		case CL_INVALID_QUEUE_PROPERTIES: 					fprintf(stderr, "CL_INVALID_QUEUE_PROPERTIES\n"); break;
		case CL_INVALID_COMMAND_QUEUE: 						fprintf(stderr, "CL_INVALID_COMMAND_QUEUE\n"); break;
		case CL_INVALID_HOST_PTR: 							fprintf(stderr, "CL_INVALID_HOST_PTR\n"); break;
		case CL_INVALID_MEM_OBJECT: 						fprintf(stderr, "CL_INVALID_MEM_OBJECT\n"); break;
		case CL_INVALID_IMAGE_FORMAT_DESCRIPTOR: 			fprintf(stderr, "CL_INVALID_IMAGE_FORMAT_DESCRIPTOR\n"); break;
		case CL_INVALID_IMAGE_SIZE: 						fprintf(stderr, "CL_INVALID_IMAGE_SIZE\n"); break;
		case CL_INVALID_SAMPLER: 							fprintf(stderr, "CL_INVALID_SAMPLER\n"); break;
		case CL_INVALID_BINARY: 							fprintf(stderr, "CL_INVALID_BINARY\n"); break;
		case CL_INVALID_BUILD_OPTIONS: 						fprintf(stderr, "CL_INVALID_BUILD_OPTIONS\n"); break;
		case CL_INVALID_PROGRAM: 							fprintf(stderr, "CL_INVALID_PROGRAM\n"); break;
		case CL_INVALID_PROGRAM_EXECUTABLE: 				fprintf(stderr, "CL_INVALID_PROGRAM_EXECUTABLE\n"); break;
		case CL_INVALID_KERNEL_NAME: 						fprintf(stderr, "CL_INVALID_KERNEL_NAME\n"); break;
		case CL_INVALID_KERNEL_DEFINITION: 					fprintf(stderr, "CL_INVALID_KERNEL_DEFINITION\n"); break;
		case CL_INVALID_KERNEL: 							fprintf(stderr, "CL_INVALID_KERNEL\n"); break;
		case CL_INVALID_ARG_INDEX: 							fprintf(stderr, "CL_INVALID_ARG_INDEX\n"); break;
		case CL_INVALID_ARG_VALUE: 							fprintf(stderr, "CL_INVALID_ARG_VALUE\n"); break;
		case CL_INVALID_ARG_SIZE: 							fprintf(stderr, "CL_INVALID_ARG_SIZE\n"); break;
		case CL_INVALID_KERNEL_ARGS: 						fprintf(stderr, "CL_INVALID_KERNEL_ARGS\n"); break;
		case CL_INVALID_WORK_DIMENSION: 					fprintf(stderr, "CL_INVALID_WORK_DIMENSION\n"); break;
		case CL_INVALID_WORK_GROUP_SIZE: 					fprintf(stderr, "CL_INVALID_WORK_GROUP_SIZE\n"); break;
		case CL_INVALID_WORK_ITEM_SIZE: 					fprintf(stderr, "CL_INVALID_WORK_ITEM_SIZE\n"); break;
		case CL_INVALID_GLOBAL_OFFSET: 						fprintf(stderr, "CL_INVALID_GLOBAL_OFFSET\n"); break;
		case CL_INVALID_EVENT_WAIT_LIST: 					fprintf(stderr, "CL_INVALID_EVENT_WAIT_LIST\n"); break;
		case CL_INVALID_EVENT: 								fprintf(stderr, "CL_INVALID_EVENT\n"); break;
		case CL_INVALID_OPERATION: 							fprintf(stderr, "CL_INVALID_OPERATION\n"); break;
		case CL_INVALID_GL_OBJECT: 							fprintf(stderr, "CL_INVALID_GL_OBJECT\n"); break;
		case CL_INVALID_BUFFER_SIZE: 						fprintf(stderr, "CL_INVALID_BUFFER_SIZE\n"); break;
		case CL_INVALID_MIP_LEVEL: 							fprintf(stderr, "CL_INVALID_MIP_LEVEL\n"); break;
		case CL_INVALID_GLOBAL_WORK_SIZE: 					fprintf(stderr, "CL_INVALID_GLOBAL_WORK_SIZE\n"); break;

		#ifdef CL_VERSION_1_1
		case CL_MISALIGNED_SUB_BUFFER_OFFSET: 				fprintf(stderr, "CL_MISALIGNED_SUB_BUFFER_OFFSET\n"); break;
		case CL_EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST:	fprintf(stderr, "CL_EXEC_STATUS_ERROR_FOR_EVENTS_IN_WAIT_LIST\n"); break;
		case CL_INVALID_PROPERTY: 							fprintf(stderr, "CL_INVALID_PROPERTY\n"); break;
		#endif

		default:											fprintf(stderr, "Invalid OpenCL error code\n");

	}

	exit(error);

}

//===============================================================================================================================================================================================================200
//	END
//===============================================================================================================================================================================================================200

#ifdef __cplusplus
}
#endif
