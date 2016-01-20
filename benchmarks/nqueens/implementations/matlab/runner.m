function runner(size)
	tic;
	[solutions,us] = nqueen_cpu(size);
	elapsedTime = toc;

	fprintf(1, '{ "status": 0, "options": "runner(%s)", "time": %f,  "output": "[%d, %d]" }\n', num2str(size), elapsedTime, solutions, us);
end
