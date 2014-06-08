/*
 * Copyright July 29, 2011 by Virginia Polytechnic Institute and State University
 * All rights reserved.
 *
 * Virginia Polytechnic Institute and State University (Virginia Tech) owns the
 * OpenCL and the 13 Dwarfs software and its associated documentation (Software).
 * You should carefully read the following terms and conditions before using this
 * software.  Your use of this Software indicates your acceptance of this license
 * agreement and all terms and conditions.
 *
 * You are hereby licensed to use the Software for Non-Commercial Purpose only.
 * Non-Commercial Purpose means the use of the Software solely for research.
 * Non-Commercial Purpose excludes, without limitation, any use of the Software, as
 * part of, or in any way in connection with a product or service which is sold,
 * offered for sale, licensed, leased, loaned, or rented.  Permission to use, copy,
 * modify, and distribute this compilation for Non-Commercial Purpose is hereby
 * granted without fee, subject to the following terms of this license.
 */


#ifndef OPENCL_DEVICE_INFO_H
#define OPENCL_DEVICE_INFO_H

#include <iostream>
#include <string>
#include <vector>
#include "support.h"
#include "SerializableObject.h"

using namespace std;

// ****************************************************************************
// Class: OpenCLDeviceInfo
//
// Purpose:
//   Instantiates and stores information about an OpenCL device.
//
// Notes:     OpenCLDeviceInfo implements the SerializableObject interface.
//
// Programmer: Gabriel Marin
// Creation: August 21, 2009
//
// Modifications:
//
// ****************************************************************************

namespace SHOC {

    class OpenCLDeviceInfo : public SerializableObject
    {
    private:
        cl_device_id id;
        unsigned int hashKey;

        cl_uint* intValues;
        size_t* sizeTValues;
        cl_ulong* longValues;
        cl_bool* boolValues;
        string* stringValues;
        int numIntValues;
        int numSizeTValues;
        int numLongValues;
        int numBoolValues;
        int numStringValues;

        int numDimensions;
        int maxKeyLength;
        int hasHalfFp;
        int hasDoubleFp;

        size_t *maxWorkSizes;

        // store the values of all bitfield properties into strings
        // this way I avoid checking the size of each type when sending
        // over the network. Plus, the bitfield types might have
        // different sizes on different implementations
        string typeValue;
        string addrBitsValue;
        string cacheTypeValue;
        string localMemValue;
        string execCapabilitiesValue;
        string queuePropertiesValue;
        string halfFpValue;
        string singleFpValue;
        string doubleFpValue;

        void FillDeviceInformation ();

        static const int MAGIC_KEY_DEVICE_INFO;

    public:
        void Print (std::ostream&) const;
        unsigned int getHashKey () const  { return (hashKey); }

        // allow to create an empty device by passing 0 for a device id.
        // This corresponds to the default empty constructor
        OpenCLDeviceInfo (cl_device_id id = 0);
        ~OpenCLDeviceInfo ();
        OpenCLDeviceInfo (const OpenCLDeviceInfo& fdi);

        OpenCLDeviceInfo& operator= (const OpenCLDeviceInfo& fdi);
        bool operator< (const OpenCLDeviceInfo& fdi) const;
        bool operator> (const OpenCLDeviceInfo& fdi) const;
        bool operator== (const OpenCLDeviceInfo& fdi) const;

        virtual void writeObject (ostringstream &oss) const;
        virtual void readObject (istringstream &iss);
    };

};

// Get device for a specified platform and device.
cl_device_id ListDevicesAndGetDevice(int platform, int device, bool output=true);

// Retrieve the number of OpenCL devices for this platform
int GetNumOclDevices(int platform);

#endif
