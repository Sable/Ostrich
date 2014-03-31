var crc32Lookup = require('./lookuptable.js');

var Polynomial = parseInt("0xEDB88320", 16);

function serialCRC(h_num, i, size){
	var j;
	var crc = ~parseInt("0x00", 16);
  var num = parseInt("0x01", 16);
	while (size--)
	{
		crc ^= h_num[i++];
		for (j = 0; j < 8; j++)
			crc = (crc >> 1) ^ (-1*(crc & num) & Polynomial);
	}
	return ~crc;
}

function Int32AsByteArray(a){ 
  var bytes = new Uint8Array(a.length * 4);
  var mask1 = parseInt("1111",2);
  var mask2 = parseInt("11110000",2);
  var mask3 = parseInt("111100000000",2);
  var mask4 = parseInt("1111000000000000",2);

  for(var i=0; i < a.length; ++i){
    var j = i * 4;
    bytes[j] = a[i] & mask1; 
    bytes[j+1] = (a[i] & mask2) >>> 8; 
    bytes[j+2] = (a[i] & mask3) >>> 16;
    bytes[j+3] = (a[i] & mask4) >>> 24;
  }
  return bytes;
}

function ByteAsInt32Array(a){ return new Uint32Array(a);}

function crc32_8bytes(data, i, length){
	var current = ByteAsInt32Array(data);
	var crc = parseInt("0xFFFFFFFF",16);
  var mask1 = parseInt("0xFF", 16);
	while (length >= 8) // process eight bytes at once
	{
		one = current[i++] ^ crc;
		two = current[i++];
		crc = crc32Lookup[7][ one  & mask1] ^
			crc32Lookup[6][(one>> 8) & mask1] ^
			crc32Lookup[5][(one>>16) & mask1] ^
			crc32Lookup[4][ one>>24] ^
			crc32Lookup[3][two & mask1] ^
			crc32Lookup[2][(two>> 8) & mask1] ^
			crc32Lookup[1][(two>>16) & mask1] ^
			crc32Lookup[0][two>>24];
		length -= 8;
	}

	while (length--) { // remaining 1 to 7 bytes
		crc = (crc >> 8) ^ crc32Lookup[0][(crc & mask1) ^ data[i++]];
	}
	return ~crc;
}

function randCRC(numPages, pageSize){
  var numWords = pageSize/4; 
  var page = new Uint8Array(numPages*pageSize); 
  
  Array.prototype.forEach.call(page, function(v, i, a) { 
    a[i] = Math.random()*256;
  });

  return page; 
}

function runCRC(numPages, pageSize){
  var data = randCRC(numPages, pageSize);
  var numWords = pageSize / 4;
  var crcs = new Uint32Array(numPages);

  var t1 = Date.now(); 
  for(var i=0; i<numPages; ++i){
    crcs[i] = crc32_8bytes(data, i*numWords, pageSize);
  }
  var t2 = Date.now();
  console.log("Total time was " + (t2-t1) + "ms  and the first element is " + 
      crcs[0]);
}

runCRC(1000,1000);
