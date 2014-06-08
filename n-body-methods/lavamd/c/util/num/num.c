/*
  Copyright (c)2008-2011 University of Virginia
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted without royalty fees or other restrictions, provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    * Neither the name of the University of Virginia, the Dept. of Computer Science, nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE UNIVERSITY OF VIRGINIA OR THE SOFTWARE AUTHORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


#ifdef __cplusplus
extern "C" {
#endif

//===============================================================================================================================================================================================================200
//	DESCRIPTION
//===============================================================================================================================================================================================================200

// Returns:	0 if string does not represent integer
//			1 if string represents integer

//===============================================================================================================================================================================================================200
//	NUM CODE
//===============================================================================================================================================================================================================200

//======================================================================================================================================================150
//	ISINTEGER FUNCTION
//======================================================================================================================================================150

int isInteger(char *str){

	//====================================================================================================100
	//	make sure it's not empty
	//====================================================================================================100

	if (*str == '\0'){
		return 0;
	}

	//====================================================================================================100
	//	if any digit is not a number, return false
	//====================================================================================================100

	for(; *str != '\0'; str++){
		if (*str < 48 || *str > 57){	// digit characters (need to include . if checking for float)
			return 0;
		}
	}

	//====================================================================================================100
	//	it got past all my checks so I think it's a number
	//====================================================================================================100

	return 1;
}

//===============================================================================================================================================================================================================200
//	END NUM CODE
//===============================================================================================================================================================================================================200

#ifdef __cplusplus
}
#endif
