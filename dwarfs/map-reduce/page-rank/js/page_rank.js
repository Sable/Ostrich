var d_factor = 0.85; //damping factor
var max_iter = 1000;
var threshold= 0.00001;

Math.commonRandom = (function() {
    var seed = 49734321;
    return function() {
        // Robert Jenkins' 32 bit vareger hash function.
        seed = ((seed + 0x7ed55d16) + (seed << 12))  & 0xffffffff;
        seed = ((seed ^ 0xc761c23c) ^ (seed >>> 19)) & 0xffffffff;
        seed = ((seed + 0x165667b1) + (seed << 5))   & 0xffffffff;
        seed = ((seed + 0xd3a2646c) ^ (seed << 9))   & 0xffffffff;
        seed = ((seed + 0xfd7046c5) + (seed << 3))   & 0xffffffff;
        seed = ((seed ^ 0xb55a4f09) ^ (seed >>> 16)) & 0xffffffff;
        return seed;
    };
})();

Math.commonRandomJS = function () {
    return Math.abs(Math.commonRandom() / 0x7fffffff);
}

// generates an array of random pages and their links 
function random_pages(n, noutlinks){
  var i, j, k;
  var pages = new Int32Array(n*n);  // matrix cell i,j means link from j->i

  for(i=0; i<n; ++i){
    noutlinks[i] = 0;
    for(j=0; j<n; ++j){
      if(i!=j && (Math.commonRandom()%2 == 1)){
        pages[i*n+j] = 1; 
        noutlinks[i] += 1; 
      }
    }
    
    // the case with no outlinks is afunctioned
    if(noutlinks[i] == 0){
      do { k = Math.commonRandom() % n; } while ( k == i);
      pages[i*n + k] = 1; 
      noutlinks[i] = 1;
    }
  }
  return pages;
}

function init_array(a, n, val){
  var i; 
  for(i=0; i<n; ++i){
    a[i] = val;
  }
}

function map_page_rank(pages, page_ranks, maps, noutlinks, n){
  var i,j;
  for(i=0; i<n; ++i){
    for(j=0; j<n; ++j){
      if(pages[i*n+j] == 1){
        maps[i*n+j] = page_ranks[j]/noutlinks[j];
      }
      else{
        maps[i*n+j] = 0.0;
      }
    }
  }
}

function reduce_page_rank(page_ranks, maps, n){
  var i, j;
  var dif = 0.0;
  var new_rank;

  for(i=0; i< n; ++i){
    new_rank = 0.0;
    for(j=0; j<n; ++j){
      new_rank += maps[i*n + j];
    }

    new_rank = ((1-d_factor)/n)+(d_factor*new_rank);
    dif = Math.abs(new_rank - page_ranks[i]) > dif ? Math.abs(new_rank - page_ranks[i]) : dif; 
  }
  return dif;
}

function runPageRank(n_, iter_, thresh_){
  var pages;
  var maps;
  var page_ranks;
  var noutlinks;
  var t;
  var max_diff;

  var n = n_ || 1000;
  var iter = iter_ || max_iter;
  var thresh = thresh_ || threshold; 

  max_diff=99.0;
  page_ranks = new Float32Array(n);
  maps = new Float32Array(n*n); 
  noutlinks = new Int32Array(n); 

  pages = random_pages(n,noutlinks);
  init_array(page_ranks, n, 1.0 / n);

  var t1 = Date.now();
  for(t=0; t< iter && max_diff > thresh; ++t){
    map_page_rank(pages, page_ranks, maps, noutlinks, n);
    max_diff = reduce_page_rank(page_ranks, maps, n);
  }
  var t2 = Date.now();
  console.log("T reached "+ t+ " at max dif " + max_diff + "\n");

  console.log("The total time taken for a random web of" + n + "pages is " +(t2-t1)/1000 + " seconds\n"); 
}


runPageRank(1000, 500, 0.00001);
