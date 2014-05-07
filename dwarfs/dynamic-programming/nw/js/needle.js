var LIMIT = -999

var rand = function(){
    return Math.abs(Math.commonRandom());
}

function maximum(a,b,c){
    var k;
    if( a <= b )
        k = b;
    else
        k = a;

    if( k <=c )
        return(c);
    else
        return(k);
}


var blosum62= [
    [ 4, -1, -2, -2,  0, -1, -1,  0, -2, -1, -1, -1, -1, -2, -1,  1,  0, -3, -2,  0, -2, -1,  0, -4],
    [-1,  5,  0, -2, -3,  1,  0, -2,  0, -3, -2,  2, -1, -3, -2, -1, -1, -3, -2, -3, -1,  0, -1, -4],
    [-2,  0,  6,  1, -3,  0,  0,  0,  1, -3, -3,  0, -2, -3, -2,  1,  0, -4, -2, -3,  3,  0, -1, -4],
    [-2, -2,  1,  6, -3,  0,  2, -1, -1, -3, -4, -1, -3, -3, -1,  0, -1, -4, -3, -3,  4,  1, -1, -4],
    [ 0, -3, -3, -3,  9, -3, -4, -3, -3, -1, -1, -3, -1, -2, -3, -1, -1, -2, -2, -1, -3, -3, -2, -4],
    [-1,  1,  0,  0, -3,  5,  2, -2,  0, -3, -2,  1,  0, -3, -1,  0, -1, -2, -1, -2,  0,  3, -1, -4],
    [-1,  0,  0,  2, -4,  2,  5, -2,  0, -3, -3,  1, -2, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4],
    [ 0, -2,  0, -1, -3, -2, -2,  6, -2, -4, -4, -2, -3, -3, -2,  0, -2, -2, -3, -3, -1, -2, -1, -4],
    [-2,  0,  1, -1, -3,  0,  0, -2,  8, -3, -3, -1, -2, -1, -2, -1, -2, -2,  2, -3,  0,  0, -1, -4],
    [-1, -3, -3, -3, -1, -3, -3, -4, -3,  4,  2, -3,  1,  0, -3, -2, -1, -3, -1,  3, -3, -3, -1, -4],
    [-1, -2, -3, -4, -1, -2, -3, -4, -3,  2,  4, -2,  2,  0, -3, -2, -1, -2, -1,  1, -4, -3, -1, -4],
    [-1,  2,  0, -1, -3,  1,  1, -2, -1, -3, -2,  5, -1, -3, -1,  0, -1, -3, -2, -2,  0,  1, -1, -4],
    [-1, -1, -2, -3, -1,  0, -2, -3, -2,  1,  2, -1,  5,  0, -2, -1, -1, -1, -1,  1, -3, -1, -1, -4],
    [-2, -3, -3, -3, -2, -3, -3, -3, -1,  0,  0, -3,  0,  6, -4, -2, -2,  1,  3, -1, -3, -3, -1, -4],
    [-1, -2, -2, -1, -3, -1, -1, -2, -2, -3, -3, -1, -2, -4,  7, -1, -1, -4, -3, -2, -2, -1, -2, -4],
    [ 1, -1,  1,  0, -1,  0,  0,  0, -1, -2, -2,  0, -1, -2, -1,  4,  1, -3, -2, -2,  0,  0,  0, -4],
    [ 0, -1,  0, -1, -1, -1, -1, -2, -2, -1, -1, -1, -1, -2, -1,  1,  5, -2, -2,  0, -1, -1,  0, -4],
    [-3, -3, -4, -4, -2, -2, -3, -2, -2, -3, -2, -3, -1,  1, -4, -3, -2, 11,  2, -3, -4, -3, -2, -4],
    [-2, -2, -2, -3, -2, -1, -2, -3,  2, -1, -1, -2, -1,  3, -3, -2, -2,  2,  7, -1, -3, -2, -1, -4],
    [ 0, -3, -3, -3, -1, -2, -2, -3, -3,  3,  1, -2,  1, -1, -2, -2,  0, -3, -1,  4, -3, -2, -1, -4],
    [-2, -1,  3,  4, -3,  0,  1, -1,  0, -3, -4,  0, -3, -3, -2,  0, -1, -4, -3, -3,  4,  1, -1, -4],
    [-1,  0,  0,  1, -3,  3,  4, -2,  0, -3, -3,  1, -1, -3, -1,  0, -1, -3, -2, -2,  1,  4, -1, -4],
    [ 0, -1, -1, -1, -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2,  0,  0, -2, -1, -1, -1, -1, -1, -4],
    [-4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4,  1]
];


function runNeedle(dimensions, pen)
{
    var max_rows, max_cols, penalty,idx, index;
    var input_itemsets, output_itemsets, referrence;
    var size;
    var t1, t2;
    var i,j;

    // the lengths of the two sequences should be able to divided by 16.
    // And at current stage  max_rows needs to equal max_cols
    max_rows = dimensions;
    max_cols = dimensions;
    penalty = penalty;

    max_rows = max_rows + 1;
    max_cols = max_cols + 1;
    referrence = new Int32Array(max_rows*max_cols);
    input_itemsets = new Int32Array(max_rows*max_cols);
    output_itemsets = new Int32Array(max_rows*max_cols);

    //need to seed with a predictable random number generator here
    for (i = 0 ; i < max_cols; i++){
        for (j = 0 ; j < max_rows; j++){
            input_itemsets[i*max_cols+j] = 0;
        }
    }

    console.log("Start Needleman-Wunsch\n");
    var t1 = Date.now();

    for( i=1; i< max_rows ; i++){    //please define your own sequence.
        input_itemsets[i*max_cols] = rand() % 10 + 1;
    }
    for( j=1; j< max_cols ; j++){    //please define your own sequence.
        input_itemsets[j] = rand() % 10 + 1;
    }

    for (i = 1 ; i < max_cols; i++){
        for (j = 1 ; j < max_rows; j++){
            referrence[i*max_cols+j] = blosum62[input_itemsets[i*max_cols]][input_itemsets[j]];
        }
    }
    for(i = 1; i< max_rows ; i++)
        input_itemsets[i*max_cols] = -i * penalty;
    for(j = 1; j< max_cols ; j++)
        input_itemsets[j] = -j * penalty;

    //Compute top-left matrix
    console.log("Processing top-left matrix\n");
    for(i = 0 ; i < max_cols-2 ; i++){
        for( idx = 0 ; idx <= i ; idx++){
            index = (idx + 1) * max_cols + (i + 1 - idx);
            input_itemsets[index]= maximum( input_itemsets[index-1-max_cols]+ referrence[index],
                                            input_itemsets[index-1]         - penalty,
                                            input_itemsets[index-max_cols]  - penalty);
        }
    }
    console.log("Processing bottom-right matrix\n");
    //Compute bottom-right matrix
    for(i = max_cols - 4 ; i >= 0 ; i--){
        for( idx = 0 ; idx <= i ; idx++){
            index =  ( max_cols - idx - 2 ) * max_cols + idx + max_cols - i - 2 ;
            input_itemsets[index]= maximum( input_itemsets[index-1-max_cols]+ referrence[index],
                                            input_itemsets[index-1]         - penalty,
                                            input_itemsets[index-max_cols]  - penalty);
        }

    }
    var t2 = Date.now();
    console.log("The total time spent isi "+ (t2-t1)/1000+ " seconds\n" );
}
