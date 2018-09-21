// Peter O.  July 16, 2007  http://www.upokecenter.com

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten/emscripten.h>

///// Necessary Structures

#define WIDTHBYTES(w,bpp)  (((w*bpp+31)>>5)<<2)

#ifdef BIGENDIAN
#define SWAPWORD(a) \
   ((WORD) ((((a)>>8)&0x00FF))\
          |((((a)<<8)&0xFF00)))
#define SWAPDWORD(a) \
  ((DWORD) ((((a)>>24)&0x000000FF))\
          |((((a)>>8) &0x0000FF00))\
          |((((a)<<8) &0x00FF0000))\
          |((((a)<<24)&0xFF000000)))
#else
#define SWAPWORD(a)  a
#define SWAPDWORD(a)  a
#endif

typedef unsigned char BYTE;
typedef unsigned short WORD;
typedef unsigned long DWORD;
typedef signed long LONG;
typedef int BOOL;

#define TRUE 1
#define FALSE 0

#pragma pack(1)
typedef struct tagBITMAPINFOHEADER {
   DWORD  biSize;
   LONG   biWidth;
   LONG   biHeight;
   WORD   biPlanes;
   WORD   biBitCount;
   DWORD  biCompression;
   DWORD  biSizeImage;
   LONG   biXPelsPerMeter;
   LONG   biYPelsPerMeter;
   DWORD  biClrUsed;
   DWORD  biClrImportant;
} BITMAPINFOHEADER;


typedef struct tagBITMAPFILEHEADER {
  WORD    bfType;
  DWORD   bfSize;
  WORD    bfReserved1;
  WORD    bfReserved2;
  DWORD   bfOffBits;
} BITMAPFILEHEADER;
#pragma pack()

/////  GB Graphics to Bitmap Files

void GbSetTile(
 BYTE *tile,
 BYTE *data,
 DWORD stride,
 BYTE clrOrigin
){
 int y;
 BYTE k1,k2;
 BYTE * bits;
 for(y=0;y<8;y++){
  k1=tile[2*y];
  k2=tile[2*y+1];
  bits=data+y*stride;
  bits[0]=clrOrigin|((k1&0x80)>>7)|((k2&0x80)>>6);
  bits[1]=clrOrigin|((k1&0x40)>>6)|((k2&0x40)>>5);
  bits[2]=clrOrigin|((k1&0x20)>>5)|((k2&0x20)>>4);
  bits[3]=clrOrigin|((k1&0x10)>>4)|((k2&0x10)>>3);
  bits[4]=clrOrigin|((k1&0x08)>>3)|((k2&0x08)>>2);
  bits[5]=clrOrigin|((k1&0x04)>>2)|((k2&0x04)>>1);
  bits[6]=clrOrigin|((k1&0x02)>>1)|((k2&0x02)   );
  bits[7]=clrOrigin|((k1&0x01)   )|((k2&0x01)<<1);
 }
}

void SaveGbBitmapTiles(
  char *filename,
  BYTE *buffer,
  DWORD sz,
  DWORD cxTile,
  DWORD cyTile,
  BOOL orient // TRUE - ltr/utd; FALSE - utd/ltr
){
 int i;
 DWORD xx=0,yy=0;
 BITMAPINFOHEADER *ret;
 BITMAPFILEHEADER bfh;
 FILE *h;
 BYTE *bits;
 DWORD stride;
 DWORD neededsz;
 DWORD numtiles=cxTile*cyTile;
 LONG width=cxTile*8;
 LONG height=cyTile*8;
 DWORD bminfo;
 BYTE *ctbl;
 bminfo=sizeof(BITMAPINFOHEADER)+1024;//header and palette
 stride=WIDTHBYTES(width,8);
 neededsz=bminfo+stride*height; //add image size
 ret=malloc(neededsz);
 if(!ret)return;
 memset(ret,0,neededsz);
 ret->biSize=sizeof(BITMAPINFOHEADER);
 ret->biWidth=width;
 ret->biHeight=-height;
 ret->biPlanes=SWAPWORD(1);
 ret->biBitCount=SWAPWORD(8);
 ret->biSize=SWAPDWORD(ret->biSize);
 ret->biWidth=SWAPDWORD(ret->biWidth);
 ret->biHeight=SWAPDWORD(ret->biHeight);
 // Calculate color table
 ctbl=((BYTE*)ret)+sizeof(BITMAPINFOHEADER);
 ctbl[0]=ctbl[1]=ctbl[2]   =0xFF;
 ctbl[4]=ctbl[5]=ctbl[6]   =0xAA;
 ctbl[8]=ctbl[9]=ctbl[10]  =0x55;
 ctbl[12]=ctbl[13]=ctbl[14]=0x00;
 // Calculate pointer to image
 bits=((BYTE*)ret)+bminfo;
 for(i=0;i<numtiles;i++){
  BYTE *d=bits+(yy<<3)*stride+(xx<<3);
  GbSetTile(buffer,d,stride,0);
  buffer+=16;
  if(orient){
   xx++;if(xx==cxTile){xx=0;yy++;}
  } else {
   yy++;if(yy==cyTile){yy=0;xx++;}
  }
 }
 bfh.bfType='B'|('M'<<8);
 bfh.bfSize=sizeof(BITMAPFILEHEADER)+neededsz;
 bfh.bfReserved1=0;
 bfh.bfReserved2=0;
 bfh.bfOffBits=sizeof(BITMAPFILEHEADER)+bminfo;
 bfh.bfType=SWAPWORD(bfh.bfType);
 bfh.bfSize=SWAPDWORD(bfh.bfSize);
 bfh.bfOffBits=SWAPDWORD(bfh.bfOffBits);
 h=fopen(filename,"wb");
 if(!h)return;
 fwrite(&bfh,sizeof(BITMAPFILEHEADER),1,h);
 fwrite(ret,neededsz,1,h);
 fclose(h);
 free(ret);
}

/////  Helper function

int xgetc(FILE *f, DWORD o){
 DWORD sav=ftell(f);
 int c;
 fseek(f,o,SEEK_SET);
 c=getc(f);
 fseek(f,sav,SEEK_SET);
 return c;
}

/////  Graphics compression

#define RLC(a) \
  ( (((a)&0x7F)<<1)|(((a)&0x80)>>7) )

#define RRC(a) \
  ( (((a)&0xFE)>>1)|(((a)&0x01)<<7) )

#define SWAP(a) \
  ( (((a)&0xF0)>>4)|(((a)&0x0F)<<4) )


#define SLA(a) \
  (((a)<<1)&0xFE)

#define SLA16(a) \
  (((a)<<1)&0xFFFE)

typedef struct{
 BYTE *ptr;
 BYTE cursize1;
 BYTE cursize2;
 BYTE size1;
 BYTE size2;
 BYTE curbyte;
 BYTE curbit;
 BYTE d084;
 BYTE d085;
 BYTE d086;
 BYTE d087;
 WORD o;
 WORD pos0;
 WORD pos1;
 WORD table1;
 WORD table2;
 WORD maxsize;
 WORD error;
} GGCONTEXT;

WORD BitMaskTable[]={
 0x0001,
 0x0003,
 0x0007,
 0x000F,
 0x001F,
 0x003F,
 0x007F,
 0x00FF,
 0x01FF,
 0x03FF,
 0x07FF,
 0x0FFF,
 0x1FFF,
 0x3FFF,
 0x7FFF,
 0xFFFF
};
BYTE BitTables[4][8]={
 {0x08,0xC4,0xE6,0x2A,0xF7,0x3B,0x19,0xD5},
 {0xF7,0x3B,0x19,0xD5,0x08,0xC4,0xE6,0x2A},
 {0x01,0x32,0x76,0x45,0xFE,0xCD,0x89,0xBA},
 {0xFE,0xCD,0x89,0xBA,0x01,0x32,0x76,0x45}
};

BYTE Tables2[16]={
 0x00,0x08,0x04,0x0C,0x02,0x0A,0x06,0x0E,
 0x01,0x09,0x05,0x0D,0x03,0x0B,0x07,0x0F
};

#define TESTPOS(ggc,x)\
 if(x>=(ggc)->maxsize){\
  (ggc)->error=1;\
  return 0;\
 }

#define NEXTBIT(x) \
 do{\
  if(!(--ggc.curbit)){\
   ggc.curbyte=xgetc(f,offset+(ggc.o++));\
   ggc.curbit=8;\
  }\
  ggc.curbyte=RLC(ggc.curbyte);\
  x=ggc.curbyte&0x01;\
 }while(0)

#define PUTTEMP(tmp) \
 do{\
  e=tmp;\
  switch(ggc.d084){\
   case 1:\
    e=SLA(e);e=SLA(e);break;\
   case 2:\
    e=SWAP(e);break;\
   case 3:\
    e=RRC(e);e=RRC(e);break;\
  }\
  TESTPOS(&ggc,ggc.pos0);\
  ggc.ptr[ggc.pos0]|=e;\
 }while(0)

#define INCPTR  \
 do{\
  ggc.cursize2++;\
  if(ggc.cursize2!=ggc.size2){\
   ggc.pos0++;\
  } else {\
   ggc.cursize2=0;\
   if(ggc.d084){\
    ggc.d084--;\
    ggc.pos0=ggc.pos1;\
   } else {\
    ggc.d084=3;\
    ggc.cursize1+=0x08;\
    if(ggc.cursize1!=ggc.size1){\
     ggc.pos0++;\
     ggc.pos1=ggc.pos0;\
    } else {\
     ggc.cursize1=0;\
     if(!(ggc.d085&0x02)){\
      ggc.d085^=0x01;\
      ggc.d085|=0x02;\
      goto label2574;\
     } else {\
      done=TRUE;\
     }\
    }\
   }\
  }\
 }while(0)

int GetGraphicsRoutine1(GGCONTEXT *ggc, WORD hl){
 BYTE b;
 BYTE tmp,c,d;
 BOOL d087Old;
 WORD a;
 BYTE e;
 WORD i,j;
 ggc->cursize1=ggc->cursize2=0;
 ggc->pos0=ggc->pos1=hl;
 if(ggc->d087){
  ggc->table1=0;
  ggc->table2=1;
 } else {
  ggc->table1=2;
  ggc->table2=3;
 }
 e=0;
 do{
  do{
   BYTE bit;
   TESTPOS(ggc,ggc->pos0);
   a=b=ggc->ptr[ggc->pos0];
   a=SWAP(a)&0x0F;
   c=a&0x01;
   a>>=1;
   bit=(ggc->d087)?(e&0x04):(e&0x01);
   if(bit){
    a=BitTables[ggc->table2][a];
   } else {
    a=BitTables[ggc->table1][a];
   }
   if(!(c&0x01))a=SWAP(a);
   a&=0x0F;
   e=a;
   d=SWAP(a);
   a=b&0x0F;
   c=a&0x01;
   a>>=1;
   bit=(ggc->d087)?(e&0x04):(e&0x01);
   if(bit){
    a=BitTables[ggc->table2][a];
   } else {
    a=BitTables[ggc->table1][a];
   }
   if(!(c&0x01))a=SWAP(a);
   a&=0x0F;
   e=a;
   a|=d;
   TESTPOS(ggc,ggc->pos0);
   ggc->ptr[ggc->pos0]=a;
   ggc->pos0+=ggc->size1;
   ggc->cursize1+=0x08;
  }while(ggc->cursize1!=ggc->size1);
  e=0;
  ggc->cursize1=0;
  ggc->cursize2++;
  if(ggc->cursize2!=ggc->size2){
   ggc->pos1++;
   ggc->pos0=ggc->pos1;
  }
 }while(ggc->cursize2!=ggc->size2);
 ggc->cursize2=0;
 return !(ggc->error);
}

int GetGraphicsRoutine2(GGCONTEXT *ggc){
 BYTE b;
 BYTE tmp,c;
 BOOL d087Old;
 WORD a;
 WORD mask,de,hl;
 BYTE e;
 WORD i,j;
 ggc->cursize1=ggc->cursize2=0;
 ggc->pos0=(ggc->d085&0x01)?0:0x188;
 ggc->pos1=(ggc->d085&0x01)?0x188:0;
 GetGraphicsRoutine1(ggc,ggc->pos0);
 ggc->pos0=(ggc->d085&0x01)?0:0x188;
 ggc->pos1=(ggc->d085&0x01)?0x188:0;
 hl=ggc->pos0;
 de=ggc->pos1;
 do{
  do{
   if(ggc->d087){
    TESTPOS(ggc,de);
    a=ggc->ptr[de];
    b=a;
    a=SWAP(a)&0x0F;
    c=Tables2[a];
    c=SWAP(c);
    a=b&0x0F;
    a=Tables2[a];
    a|=c;
    ggc->ptr[de]=a;
   }
   TESTPOS(ggc,hl);
   TESTPOS(ggc,de);
   a=ggc->ptr[hl++]^ggc->ptr[de];
   ggc->ptr[de++]=a;
   ggc->cursize2++;
  }while(ggc->cursize2!=ggc->size2);
  ggc->cursize2=0;
  ggc->cursize1+=0x08;
 }while(ggc->cursize1!=ggc->size1);
 ggc->cursize1=0;
 return !(ggc->error);
}

int GetGraphics(
 FILE *f,
 DWORD offset,
 BYTE *ptr,
 DWORD sz
){
 GGCONTEXT ggc;
 BYTE b;
 BYTE tmp,c;
 BOOL d087Old;
 WORD a;
 WORD mask,de,hl;
 BYTE e;
 WORD i,j;
 BOOL done=FALSE;
 BYTE tmpbuf[0x310];
 ggc.size1=0;
 ggc.size2=0;
 ggc.cursize1=0;
 ggc.cursize2=0;
 ggc.curbit=1;
 ggc.d085=0;
 ggc.d086=1;
 ggc.d084=3;
 ggc.d087=0;
 ggc.pos0=0;
 ggc.pos1=0;
 ggc.ptr=tmpbuf;
 ggc.table1=0;
 ggc.table2=0;
 ggc.o=0;
 ggc.maxsize=0x310;
 ggc.error=0;
 ggc.curbyte=xgetc(f,offset+(ggc.o++));
 if(ggc.curbyte!=0x44
  &&ggc.curbyte!=0x55
  &&ggc.curbyte!=0x66
  &&ggc.curbyte!=0x77)return 0;
 b=ggc.curbyte;
 ggc.size1=(b&0x0F)*8;
 b=SWAP(b);
 ggc.size2=(b&0x0F)*8;
 memset(tmpbuf,0,0x310);
 NEXTBIT(tmp);
 ggc.d085=tmp;
label2574:
 ggc.pos0=ggc.pos1=(ggc.d085&0x01)?0x188:0;
 if(ggc.d085&0x02){
  NEXTBIT(tmp);
  if(tmp){
   NEXTBIT(tmp);
   tmp++;
  }
  ggc.d086=tmp;
 }
 NEXTBIT(tmp);
 while(!done){
  if(tmp){
   while(1){
    NEXTBIT(tmp);
    c=tmp;
    NEXTBIT(tmp);
    tmp|=SLA(c);
    if(tmp){
     PUTTEMP(tmp);
     INCPTR;
    } else break;
   }
  }
  if(done)break;
  c=0;
  do{
   NEXTBIT(tmp);
   if(tmp)c++;
  }while(tmp);
  mask=BitMaskTable[c];
  de=0;
  c++;
  do{
   NEXTBIT(tmp);
   de=tmp|de;
   if(--c){
    de=SLA16(de);
   }
  }while(c);
  de+=mask;
  do{
   tmp=0;
   PUTTEMP(tmp);
   INCPTR;
   if(done)break;
   de--;
   if(de==0){
    tmp=1;//to continue upper loop
    break;
   }
  }while(1);
 }
 if(ggc.d086==0){
  GetGraphicsRoutine1(&ggc,0);
  GetGraphicsRoutine1(&ggc,0x188);
 } else if(ggc.d086==1){
  GetGraphicsRoutine2(&ggc);
 } else {
  ggc.pos0=(ggc.d085&0x01)?0:0x188;
  ggc.pos1=(ggc.d085&0x01)?0x188:0;
  d087Old=ggc.d087;
  ggc.d087=0;
  GetGraphicsRoutine1(&ggc,ggc.pos1);
  ggc.pos0=(ggc.d085&0x01)?0:0x188;
  ggc.pos1=(ggc.d085&0x01)?0x188:0;
  ggc.d087=d087Old;
  GetGraphicsRoutine2(&ggc);
 }
 for(i=0;i<0x188;i++){
  ptr[(i<<1)]=ggc.ptr[i];
  ptr[(i<<1)|1]=ggc.ptr[0x188+i];
 }
 return !(ggc.error);
}

int NumberToIndex(BYTE *ord,DWORD len,int n){
 int i;
 for(i=0;i<len;i++){
  if(ord[i]==n)return i;
 }
 return -1;
}

void RedBlueGraphics(FILE *f, WORD bSize, DWORD wFront, DWORD wBack){
  int i;
  BYTE buffer[1024];
  BYTE bmp[256];
  BOOL have=TRUE;

  for(i=1;i<2;i++){
    // Get front graphics
    have=GetGraphics(f,wFront,buffer,1024); // Put GFX Data in buffer
    if(!have)break; // If failed, abort
    sprintf(bmp,"%03d.bmp",i);
    SaveGbBitmapTiles(bmp,buffer,bSize*bSize*16,bSize,bSize,FALSE);

    // Get back graphic
    have=GetGraphics(f,wBack,buffer,1024); // Put GFX Data in buffer
    if(!have)break; // If failed, abort
    sprintf(bmp,"%03db.bmp",i);
    SaveGbBitmapTiles(bmp,buffer,16*16,4,4,FALSE);
  }
}

// void RedBlueGraphicsOld(FILE *f){
//  int i;
//  BYTE rbpkdx[28]; // Pokedex entry
//  BYTE buffer[1024]; // Data buffer
//  BYTE bmp[256]; // BMP Buffer
//  BYTE pb[256];
//  WORD pal[4];
//  BYTE palno;
//  fseek(f,0x41024,SEEK_SET);
//  fread(pb,256,1,f); // read internal order
//  for(i=1;i<=151;i++){
//   DWORD wBack,wFront; // Pointers to sprites
//   WORD bSize; // Frontsprite SIZE
//   DWORD o1=0x24000;
//   BOOL have=TRUE;
//   DWORD bank;
//   int j=NumberToIndex(pb,0xBE,i)+1;
//   if(i==151){
//    fseek(f,0x425b,SEEK_SET);
//   } else {
//    DWORD o=0x383de;
//    fseek(f,o+((i-1)*28),SEEK_SET);
//   }
//   if(j==0x15){
//    bank=1;
//   } else if(j==0xB6){
//    bank=0x0B;
//   } else if(j<0x1F){
//    bank=0x09;
//   } else if(j<0x4A){
//    bank=0x0A;
//   } else if(j<0x74){
//    bank=0x0B;
//   } else if(j<0x99){
//    bank=0x0C;
//   } else {
//    bank=0x0D;
//   }
//   o1=(bank-1)<<14;
//   fread(rbpkdx,28,1,f);
//   bSize=rbpkdx[10]&0x0F;
//   wFront=rbpkdx[11]|(rbpkdx[12]<<8);
//   wBack=rbpkdx[13]|(rbpkdx[14]<<8);
//   memset(buffer,0,1024);
//   // Get front graphic
//   have=GetGraphics(f,o1+wFront,buffer,1024);
//   if(!have)continue;
//   sprintf(bmp,"%03d.bmp",i);
//   SaveGbBitmapTiles(bmp,buffer,bSize*bSize*16,bSize,bSize,FALSE);
//   // Get back graphic
//   have=GetGraphics(f,o1+wBack,buffer,1024);
//   sprintf(bmp,"%03db.bmp",i);
//   SaveGbBitmapTiles(bmp,buffer,16*16,4,4,FALSE);
//  }
// }

int main(int argc,char **argv){
 printf("Initialized\r\n");

 return 0;
}

int EMSCRIPTEN_KEEPALIVE processFile(WORD bSize, DWORD wFront, DWORD wBack) {
 FILE *f=fopen("./data.bin","rb");
 if(!f){
  printf("Can't find Data file. Please name the file data.bin and try again.\r\n");
  return 1;
 }
 RedBlueGraphics(f, bSize, wFront, wBack);
 fclose(f);
 return 0;
}
