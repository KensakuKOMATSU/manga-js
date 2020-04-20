const getCanvasContext = (width, height) => {
  const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

  return canvas.getContext('2d')
}

class Manga {
  constructor(props) {
    this.props = Object.assign({}, {
      edge: true,
      tone: true,
      dark: 200,
      bright: 224,
    }, props )

    this.stream = null
  }


  start = stream => {
    return new Promise( (resolve, reject) => {
      const videoElem = document.createElement('video')
      videoElem.srcObject = stream

      videoElem.addEventListener('loadedmetadata', e => {
        videoElem.play()

        const w = videoElem.videoWidth
          , h = videoElem.videoHeight

        const tmpCtx = getCanvasContext(w, h)
          , mangaCtx = getCanvasContext(w, h)

        this.stream = mangaCtx.canvas.captureStream()

        const mangaImg = mangaCtx.createImageData( w, h )

        const _draw = () => {
          tmpCtx.drawImage( videoElem, 0, 0, w, h )
          const imgData = tmpCtx.getImageData(0, 0, w, h)
          getMangaImg( imgData, mangaImg, w, h, this.props )
          mangaCtx.putImageData( mangaImg, 0, 0 )

          requestAnimationFrame( _draw )
        }

        _draw()
        resolve()
      }, false)
    })
  }
}


// マンガ化処理関数

/**
 * @params {object} img
 * @params {object} img_toon
 * @params {number} width
 * @params {number} height
 * @params {object} options
 * @params {boolean} options.edge
 * @params {boolean} options.bright
 * @params {number} options.dark
 * @params {number} options.bright
 *
 *
 */
const getMangaImg = function(img, img_toon, width, height, options){
  // edgeとtoneがfalseの時は何もしない
  if(!options.edge && !options.tone) return img;

  var dotList = img.data;

  var gray;
  var tmp;
  var a0, a1, a2, a3;
  var c, i;
  var p;
  var FILTER = 0xff00;
  var dark = options.dark || 86;
  var bright = options.bright || 171;

  var x, y, gra, dx_, dy_;
  for(var y = 1; y < height-1; y++){
    for(var x = 1; x < width-1; x++){

      c = y * width + x;

      i = c << 2;

      tmp = (c - width) << 2;
      a0 = (dotList[tmp] + dotList[tmp+1] + dotList[tmp + 2]) & FILTER;
      tmp = (c - 1) << 2;
      a1 = (dotList[tmp] + dotList[tmp+1] + dotList[tmp + 2]) & FILTER;
      tmp = (c + 1) << 2;
      a2 = (dotList[tmp] + dotList[tmp+1] + dotList[tmp + 2]) & FILTER;
      tmp = (c + width) << 2;
      a3 = (dotList[tmp] + dotList[tmp+1] + dotList[tmp + 2]) & FILTER;

      gray = (dotList[i] + dotList[i+1] + dotList[i + 2] );



      if((a0 + a1 + a2+ a3) < ((gray & FILTER) << 2)) {
        if(options.edge) {
          img_toon.data[i] = 0;
          img_toon.data[i+1] = 0;
          img_toon.data[i+2] = 0;
        }
      } else {
        if(options.tone) {
          if( gray < dark ) {
            gra = 0;
          } else if( gray > bright ) {
            gra = 255;
          } else {
            gra = 1;
          }

          //　スクリーントーン化
          if( gra == 1 ) {
            dx_ = (x & 0x03)
            dy_ = (y & 0x03)


            if( (!dx_ && !dy_) || (dx_ == 2) && (dy_ == 2)){
              gra = 0;
            } else {
              gra = 255;
            }
          };
        } else {
          gra = 255;
        }


        //漫画生成
        img_toon.data[i] = gra;
        img_toon.data[i+1] = gra;
        img_toon.data[i+2] = gra;
      }
      img_toon.data[i+3] = 0xff; //img.data[i + 3];
    }
  }
}
