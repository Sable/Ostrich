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



#ifndef OPENCL_NODE_PLATFORM_CONTAINER_H
#define OPENCL_NODE_PLATFORM_CONTAINER_H

#include <iostream>
#include <string>
#include <list>
#include "support.h"
#include "OpenCLPlatform.h"
#include "NodePlatformContainer.h"

using namespace std;

// ****************************************************************************
// Class: OpenCLNodePlatformContainer
//
// Purpose:
//   A container for all OpenCL platforms on a node.
//
// Notes:     Extends the generic node platform container class
//
// Programmer: Gabriel Marin
// Creation: September 22, 2009
//
// Modifications:
//
// ****************************************************************************
namespace SHOC {

    class OpenCLNodePlatformContainer : public NodePlatformContainer<OpenCLPlatform>
    {
    private:
        static const int MAGIC_KEY_OPENCL_NODE_CONTAINER;

    public:
        // constructor collects information about all platforms on this node
        OpenCLNodePlatformContainer (bool do_initialize = true);
        OpenCLNodePlatformContainer (const OpenCLNodePlatformContainer &ondc);
        OpenCLNodePlatformContainer& operator= (const OpenCLNodePlatformContainer &ondc);

        ~OpenCLNodePlatformContainer () { }

        void Print (ostream &os) const;

        void initialize();

        virtual void writeObject (ostringstream &oss) const;
        virtual void readObject (istringstream &iss);

        bool operator< (const OpenCLNodePlatformContainer &ndc) const;
        bool operator> (const OpenCLNodePlatformContainer &ndc) const;
        bool operator== (const OpenCLNodePlatformContainer &ndc) const;
    };
};


#endif
