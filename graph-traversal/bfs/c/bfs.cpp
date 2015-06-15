#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>
#include <limits.h>
#include <vector>

#include "../common/common_rand.h"
#include "../common/common.h"


#define MIN_NODES      20
#define MAX_NODES      ULONG_MAX
#define MIN_EDGES      2
#define MAX_INIT_EDGES 4
#define MIN_WEIGHT     1
#define MAX_WEIGHT     10

#define NUM_NODES      132768

using namespace std;

//Structure to hold a node information
struct Node
{
    int starting;
    int no_of_edges;
};


struct edge; // forward declaration
typedef vector<edge> node;
struct edge {
    unsigned long dest;
    unsigned weight;
};

void BFSGraph(int argc, char** argv);
void InitializeGraph(Node**, bool**, bool**, bool**, int**, int**, int, char*, char*);

void Usage(char**argv) {
    fprintf(stdout,"Usage: %s <num_nodes> [<vertices_file_path> <edges_file_path> <cost_file_path>]\n", argv[0]);
}
////////////////////////////////////////////////////////////////////////////////
// Main Program
////////////////////////////////////////////////////////////////////////////////
int main( int argc, char** argv) {
    BFSGraph( argc, argv );
    return 0;
}



////////////////////////////////////////////////////////////////////////////////
//Apply BFS on a Graph using CUDA
////////////////////////////////////////////////////////////////////////////////
void BFSGraph( int argc, char** argv) {
    char *vertice_file_path = NULL;
    char *edge_file_path = NULL;
    char *cost_file_path = NULL;
    unsigned int expected_no_of_nodes = 3000000;
    unsigned long int expected_total_cost = 26321966;
    int no_of_nodes;
    if (argc == 1) {
        fprintf(stderr, "Using default number of nodes %d\n", NUM_NODES);
        no_of_nodes = NUM_NODES;
    }
    else if (argc == 2) {
        no_of_nodes = atoi(argv[1]);
        fprintf(stderr, "Using %d nodes\n", no_of_nodes);
    }
    else if (argc == 5) {
        no_of_nodes = atoi(argv[1]);
        vertice_file_path = argv[2];
        edge_file_path = argv[3];
        cost_file_path = argv[4];
        fprintf(stderr, "Using %d nodes and saving inputs and output in files:\n%s\n%s\n%s\n", no_of_nodes, vertice_file_path, edge_file_path, cost_file_path);
    }
    else {
        fprintf(stderr, "Missing vertice_file_path, edge_file_path and/or cost_file_path argument\n");
        exit(1);
    }


    Node *h_graph_nodes;
    bool *h_graph_mask;
    bool *h_updating_graph_mask;
    bool *h_graph_visited;
    int  *h_graph_edges;
    int  *h_cost;
    stopwatch sw1, sw2;

    stopwatch_start(&sw2);
    InitializeGraph(
        &h_graph_nodes,
        &h_graph_mask,
        &h_updating_graph_mask,
        &h_graph_visited,
        &h_graph_edges,
        &h_cost,
        no_of_nodes,
        vertice_file_path,
        edge_file_path);
    stopwatch_stop(&sw2);

    int k=0;



    stopwatch_start(&sw1);
    bool stop;
    do
    {
//if no thread changes this value then the loop stops
        stop=false;

        for(int tid = 0; tid < no_of_nodes; tid++ )
        {
            if (h_graph_mask[tid] == true){
                h_graph_mask[tid]=false;
                for(int i=h_graph_nodes[tid].starting; i<(h_graph_nodes[tid].no_of_edges + h_graph_nodes[tid].starting); i++)
                {
                    int id = h_graph_edges[i];
                    if(!h_graph_visited[id])
                    {
                        h_cost[id]=h_cost[tid]+1;
                        h_updating_graph_mask[id]=true;
                    }
                }
            }
        }

        for(int tid=0; tid< no_of_nodes ; tid++ )
        {
            if (h_updating_graph_mask[tid] == true){
                h_graph_mask[tid]=true;
                h_graph_visited[tid]=true;
                stop=true;
                h_updating_graph_mask[tid]=false;
            }
        }
        k++;
    }
    while(stop);
    stopwatch_stop(&sw1);

    unsigned long total_cost = 0;
    for(int i=0;i<no_of_nodes;i++) {
        total_cost += h_cost[i];
    }


    if (no_of_nodes == expected_no_of_nodes) {
        if (total_cost != expected_total_cost) {
          fprintf(stdout, "ERROR: the total cost obtained for '%d' nodes  is '%lu' while the expected cost is '%lu'\n", no_of_nodes, total_cost, expected_total_cost);
            exit(1);
        }
    } else {
        fprintf(stderr, "WARNING: no self-checking step for '%u' nodes, only valid for '%u' nodes\n", no_of_nodes, expected_no_of_nodes);
    }

    fprintf(stderr, "// Init time     : %f s\n", get_interval_by_sec(&sw2));

    if (cost_file_path != NULL) {
        FILE *fp = fopen(cost_file_path, "w");
        for (int i=0; i<no_of_nodes; ++i) {
            fprintf(fp, "%d\n", h_cost[i]);
        }
        fclose(fp);
    }

    free(h_graph_nodes);
    free(h_graph_edges);
    free(h_graph_mask);
    free(h_updating_graph_mask);
    free(h_graph_visited);
    free(h_cost);

    fprintf(stdout, "{\"options\": \"%d\", \"time\": %f, \"status\": %d}\n", no_of_nodes, get_interval_by_sec(&sw1), 1);
}



void InitializeGraph(
    Node **h_graph_nodes,
    bool **h_graph_mask,
    bool **h_updating_graph_mask,
    bool **h_graph_visited,
    int  **h_graph_edges,
    int  **h_cost,
    int numNodes,
    char  *vertice_file_path,
    char  *edge_file_path) {

    node *graph = new node[numNodes];
    int source = 0;
    unsigned numEdges;
    unsigned long nodeID;
    unsigned weight;

    *h_graph_nodes = (Node*) malloc(sizeof(Node)*numNodes);
    *h_graph_mask = (bool*) malloc(sizeof(bool)*numNodes);
    *h_updating_graph_mask = (bool*) malloc(sizeof(bool)*numNodes);
    *h_graph_visited = (bool*) malloc(sizeof(bool)*numNodes);
    *h_cost = (int*) malloc(sizeof(int)*numNodes);

    for (int i = 0; i < numNodes; ++i) {
        numEdges = abs(common_rand() % ( MAX_INIT_EDGES - MIN_EDGES + 1 )) + MIN_EDGES;
        for ( unsigned j = 0; j < numEdges; j++ ) {
            nodeID = abs(common_rand() % numNodes);
            weight = abs(common_rand() % ( MAX_WEIGHT - MIN_WEIGHT + 1 )) + MIN_WEIGHT;
            graph[i].push_back( edge() );
            graph[i].back().dest = nodeID;
            graph[i].back().weight = weight;
            graph[nodeID].push_back( edge() );
            graph[nodeID].back().dest = i;
            graph[nodeID].back().weight = weight;
        }
    }

    unsigned long totalEdges = 0;
    for (int i = 0; i < numNodes; ++i) {
        unsigned long numEdges = graph[i].size();
        (*h_graph_nodes)[i].starting = totalEdges;
        (*h_graph_nodes)[i].no_of_edges = numEdges;
        (*h_graph_mask)[i] = false;
        (*h_updating_graph_mask)[i] = false;
        (*h_graph_visited)[i] = false;

        totalEdges += numEdges;
    }

    *h_graph_edges = (int*) malloc(sizeof(int)*totalEdges);


    (*h_graph_mask)[source] = true;
    (*h_graph_visited)[source] = true;

    unsigned k = 0;
    for ( unsigned long i = 0; i < numNodes; i++ ) {
        for ( unsigned j = 0; j < graph[i].size(); j++ ) {
            (*h_graph_edges)[k] = graph[i][j].dest;
            ++k;
        }
    }

    for(int i = 0; i < numNodes; ++i) {
        (*h_cost)[i] = -1;
    }
    (*h_cost)[source] = 0;

    delete[] graph;

    if (vertice_file_path != NULL && edge_file_path != NULL) {
        FILE *fp = fopen(vertice_file_path, "w");
        for (int i=0; i<numNodes; ++i) {
            fprintf(fp, "%d,%d\n", (*h_graph_nodes)[i].starting, (*h_graph_nodes)[i].no_of_edges);
        }
        fclose(fp);

        fp = fopen(edge_file_path, "w");
        for (int i=0; i<totalEdges; ++i) {
            fprintf(fp, "%d\n", (*h_graph_edges)[i]);
        }
        fclose(fp);
    }
}
