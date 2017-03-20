var width,
    height,
    old_dst = [],
    dst,
    box_width = 16,
    box_height = 16,
    step = 16;

var min_x = min_y = max_x = max_y = 0;

function reverseIndexer(x, y) {
    var index = (y * width * 4) + ((width - x - 3) * 4);
    return index;
}

function getCoord(i) {
   var real_i = i / 4; 
   var y = ~~(real_i / width);
   var x = real_i % width;
   return [x,y];
}

function dist(x1, y1, x2,y2) {
    var xdist = Math.abs(x1 - x2),
        ydist = Math.abs(y1 - y2);
    return Math.sqrt(Math.pow(xdist, 2) + Math.pow(ydist, 2));
}

function set_box_limits() {
    min_x = ~~(width/2) - 8;
    min_y = ~~(height/2) - 8
    max_x = min_x + box_width;
    max_y = min_y + box_height;
}

function over_one(index, direction) {
    var new_index = index;
    switch (direction) {
        case 'left':
            new_index -=4;
            break;
        case 'right':
            new_index +=4;
            break;
        case 'up':
            new_index -= width * 4;
            break;
        case 'down':
            new_index += width * 4;
            break;
    }
    return new_index;
}

function indexer(x, y) {
    var index = (y * width * 4) + (x * 4);
    return index;
}

function getMatrixPieces() {
    var A2 = A1B2 = B1 = C2 = C1 = 0;

    for (var localY = min_y; localY <= max_y; localY++) {
        for (var localX = min_x; localX <= max_x; localX++) {
            var index = indexer(localX, localY, width);
            var gradX = (dst[over_one(index, 'left')] - dst[over_one(index, 'right')]);
            var gradY = (dst[over_one(index, 'up')] - dst[over_one(index, 'down')]);
            var gradT = (old_dst[index]) - (dst[index]);

            A2 += gradX * gradX;
            A1B2 += gradX * gradY;
            B1 += gradY * gradY;
            C2 += gradX * gradT;
            C1 += gradY * gradT;
        }
    }

    var delta = (A1B2 * A1B2 - A2 * B1);

    if (delta !== 0) {
        /* system is not singular - solving by Kramer method */
        var Idelta = step / delta;
        var deltaX = -(C1 * A1B2 - C2 * B1);
        var deltaY = -(A1B2 * C2 - A2 * C1);

        u = deltaX * Idelta;
        v = deltaY * Idelta;
    } else {
        /* singular system - find optical flow in gradient direction */
        var norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
        if (norm !== 0) {
            var IGradNorm = step / norm;
            var temp = -(C1 + C2) * IGradNorm;

            u = (A1B2 + A2) * temp;
            v = (B1 + A1B2) * temp;
        } else {
            u = v = 0;
        }
    }

    return [u, v];
}

// message receiver
onmessage = function(event) {

    var imageData = event.data.imageData;

    width = event.data.width,
    height = event.data.height;

    if ((min_x <= 0) || (min_y <=0) ||
        (max_x >= width) || (max_y >= height))

    {
        set_box_limits();
    }

    dst = imageData.data;
    var new_arr = [];

    for (var i = 0; i < dst.length; i += 4 ) {
        coord = getCoord(i);
        reverse_index = reverseIndexer(coord[0], coord[1]);

        new_arr[i] = dst[reverse_index];
        new_arr[i + 1] = dst[reverse_index + 1];
        new_arr[i + 2] = dst[reverse_index + 2];
        new_arr[i + 3] = dst[reverse_index + 3];
    }

    dst = new_arr;

    if (old_dst.length == 0) {
        old_dst = dst;
    }

    var x = y = index = val = 0;
    for (y = min_y; y <= max_y; y++) {
        dst[indexer(min_x, y)] = dst[indexer(max_x, y)] = 200;
    }
    
    for (x = min_x; x <= max_x; x++) {
        dst[indexer(x, min_y)] = dst[indexer(x, max_y)] = 200;
    }


    vector = getMatrixPieces();

    min_x += ~~vector[0];
    max_x += ~~vector[0];
    min_y += ~~vector[1];
    max_y += ~~vector[1];


    old_dst = dst;
    imageData.data.set(dst,0);

    /* B&W */
    // for (var i=0; i < dst.length; i += 4) {
    //     dst[i+1] = dst[i+2] = dst[i];
    // }

    postMessage({
        dstData: imageData,
        vector: vector
    });
};