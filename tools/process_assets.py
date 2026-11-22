# Asset pipeline for "ЧЕРЕПАХА 2278": cutouts, turtle puppet-warp animation atlas, enemy sheet split.
import numpy as np, cv2, json, os
from PIL import Image
SRC='/files/conversation/'; OUT='/files/conversation/turtle2278/assets/'
os.makedirs(OUT,exist_ok=True)

def cutout(path, tol=30, erode=1, keep_largest=False, min_area=400):
    pim=Image.open(path)
    if pim.mode=='RGBA' and (np.array(pim)[:,:,3]<10).mean()>0.2:
        return np.array(pim)  # already transparent
    im=np.array(pim.convert('RGB')).astype(np.int32)
    mn=im.min(2); mx=im.max(2)
    cand=((mn>255-tol-10)&((mx-mn)<tol)).astype(np.uint8)
    n,lab=cv2.connectedComponents(cand,connectivity=4)
    border=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]))
    border=[b for b in border if b!=0 or cand[0,0]]
    bg=np.isin(lab,border)&(cand==1)
    fg=(~bg).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(fg,connectivity=8)
    keep=np.zeros_like(fg)
    if keep_largest:
        i=1+np.argmax(st[1:,4]); keep[lab==i]=1
    else:
        for i in range(1,n):
            if st[i,4]>=min_area: keep[lab==i]=1
    fg=keep
    if erode: fg=cv2.erode(fg,np.ones((3,3),np.uint8),iterations=erode)
    # defringe: recolor outer band from interior
    inner=cv2.erode(fg,np.ones((3,3),np.uint8),iterations=2)
    band=((fg>0)&(inner==0)).astype(np.uint8)
    rgb8=im.astype(np.uint8)
    fixed=cv2.inpaint(rgb8,band,3,cv2.INPAINT_TELEA)
    a=cv2.GaussianBlur(fg.astype(np.float32),(0,0),0.8)
    a=np.clip(a*1.15,0,1)
    out=np.dstack([fixed,(a*255).astype(np.uint8)])
    return out

def crop_alpha(arr,pad=4):
    ys,xs=np.where(arr[:,:,3]>8)
    x0,x1,y0,y1=max(xs.min()-pad,0),min(xs.max()+pad,arr.shape[1]),max(ys.min()-pad,0),min(ys.max()+pad,arr.shape[0])
    return arr[y0:y1,x0:x1]

def save(arr,name,maxw=None,maxh=None,fmt='webp',q=88):
    im=Image.fromarray(arr,'RGBA')
    if maxw or maxh:
        w,h=im.size; s=min((maxw or 1e9)/w,(maxh or 1e9)/h,1)
        if s<1: im=im.resize((max(1,int(w*s)),max(1,int(h*s))),Image.LANCZOS)
    p=OUT+name+'.'+fmt
    im.save(p,quality=q,method=6) if fmt=='webp' else im.save(p,optimize=True)
    print('saved',p,im.size,os.path.getsize(p)//1024,'KB'); return im.size

def outline(arr,px=2,color=(25,15,5)):
    a=(arr[:,:,3]>40).astype(np.uint8)
    d=cv2.dilate(a,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*px+1,2*px+1)))
    o=np.zeros_like(arr); o[:,:,:3]=color; o[:,:,3]=(d*200).astype(np.uint8)
    base=Image.fromarray(o,'RGBA'); base.alpha_composite(Image.fromarray(arr,'RGBA'))
    return np.array(base)

# ---------- 1. main turtle (photo) ----------
T=cutout(SRC+'изображение.png',tol=26,erode=1,keep_largest=True)
# remove ground shadow: grey low-sat pixels + dark contact shadow under shell
rgb=T[:,:,:3].astype(int); mx=rgb.max(2); mn=rgb.min(2); lum=rgb.mean(2)
H,Wd=T.shape[:2]; yy,xx=np.mgrid[0:H,0:Wd]
grey=((mx-mn)<22)&(lum>=105)&(yy>420)
dark=((mx-mn)<26)&(lum<105)&(yy>446)&(xx>372)&(xx<548)
kill=(grey|dark).astype(np.uint8)
kill=cv2.morphologyEx(kill,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
T[:,:,3]=np.where(kill>0,0,T[:,:,3])
# keep largest comp again
a=(T[:,:,3]>20).astype(np.uint8); n,lab,st,_=cv2.connectedComponentsWithStats(a,8)
i=1+np.argmax(st[1:,4]); T[:,:,3]=np.where(lab==i,T[:,:,3],0)
T[:,:,3]=cv2.GaussianBlur(T[:,:,3],(0,0),0.6)
ys,xs=np.where(T[:,:,3]>20); print('turtle bbox',xs.min(),xs.max(),ys.min(),ys.max())
Image.fromarray(T,'RGBA').save('/tmp/w/turtle_cut.png')

# shell-only (AI) aligned into original shell box
S=crop_alpha(cutout(SRC+'ai_turtle_shell_only.png',keep_largest=True),0)
box=(214,226,584,466)  # x0,y0,x1,y1 in original coords
Sr=cv2.resize(S,(box[2]-box[0],box[3]-box[1]),interpolation=cv2.INTER_AREA)
SH=np.zeros_like(T); SH[box[1]:box[3],box[0]:box[2]]=Sr

# control points (original 700px coords)
PTS=dict(L1f=(112,428),L1k=(160,392),L2f=(342,462),L2k=(305,420),L3f=(596,440),L3k=(560,424),head=(222,338),neck=(272,334),shell=(400,330))
def warp(img,ctrl,glob=(0,0),rot=0,piv=(350,470)):
    h,w=img.shape[:2]; Y,X=np.mgrid[0:h,0:w].astype(np.float32)
    DX=np.full((h,w),glob[0],np.float32); DY=np.full((h,w),glob[1],np.float32)
    for (px,py),(dx,dy),sg in ctrl:
        wgt=np.exp(-((X-px-dx)**2+(Y-py-dy)**2)/(2*sg*sg))
        DX+=wgt*dx; DY+=wgt*dy
    mx=X-DX; my=Y-DY
    if rot:
        c,s=np.cos(-rot),np.sin(-rot); ox,oy=mx-piv[0],my-piv[1]
        mx,my=(piv[0]+c*ox-s*oy).astype(np.float32),(piv[1]+s*ox+c*oy).astype(np.float32)
    return cv2.remap(img,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(0,0,0,0))

def legs(d1,d2,d3,s=28):
    return [(PTS['L1f'],d1,s),(PTS['L1k'],(d1[0]*.45,d1[1]*.45),s),
            (PTS['L2f'],d2,s),(PTS['L2k'],(d2[0]*.45,d2[1]*.45),s),
            (PTS['L3f'],d3,s),(PTS['L3k'],(d3[0]*.45,d3[1]*.45),s)]
def head(d,s=42): return [(PTS['head'],d,s),(PTS['neck'],(d[0]*.5,d[1]*.5),s)]

CX0,CY0,CX1,CY1=20,170,680,500  # crop -> frame 256x128
FW,FH=256,128
def frame(img):
    c=img[CY0:CY1,CX0:CX1]
    c=cv2.resize(c,(FW,FH),interpolation=cv2.INTER_AREA)
    return c
rows={}
pi=np.pi
# idle
rows['idle']=[warp(T,head((2*np.sin(2*pi*f/8),1.5*np.sin(2*pi*f/8+1))),glob=(0,-1.5*(1+np.sin(2*pi*f/8))/2)) for f in range(8)]
# walk (diagonal gait)
def gait(ph,A=20,L=13):
    return (A*np.cos(ph), -L*max(0,np.sin(ph)))
walk=[]
for f in range(8):
    ph=2*pi*f/8; bob=-2.5*abs(np.sin(ph))
    d1=gait(ph); d2=gait(ph+pi); d3=gait(ph)
    c=legs((d1[0],d1[1]-bob),(d2[0],d2[1]-bob),(d3[0]*.8,d3[1]-bob))+head((-2*np.sin(ph),2*np.sin(2*ph)))
    walk.append(warp(T,c,glob=(0,bob)))
rows['walk']=walk
# attack (head lunge)
att=[]
for k in [0,-0.25,0.35,1,1,0.7,0.35,0.1]:
    hd=(-30*k,4*k) if k>=0 else (12*-k*4,0)
    att.append(warp(T,head(hd,46)+legs((-4*max(k,0),0),(4*max(k,0),0),(6*max(k,0),0)),glob=(-6*max(k,0),0)))
rows['attack']=att
# hide
hid=[]
for f in range(8):
    t=min(f/5,1)
    if f<5:
        c=head((38*t,-6*t),48)+legs((40*t,-30*t),(-25*t,-30*t),(-30*t,-12*t),38)
        im=warp(T,c,glob=(0,3*t))
        if f>=3:
            al=(f-2)/3.0
            im=(im.astype(np.float32)*(1-al)+SH.astype(np.float32)*al).astype(np.uint8)
        hid.append(im)
    else:
        hid.append(warp(SH,[],glob=(0,(f-5)*0.0),rot=0.0))
rows['hide']=hid
# jump: crouch, stretch, air, tuck, land
jp=[]
for (l1,l2,l3,hy,gy) in [((4,-6),(0,-6),(-4,-4),3,4),((-14,14),(8,16),(14,12),-5,-2),((-16,16),(10,18),(16,14),-6,-4),
                          ((-8,-10),(4,-12),(8,-8),-3,-2),((6,-18),(-8,-18),(-10,-12),2,0),((-6,4),(4,6),(6,4),0,0),((2,-4),(0,-4),(-2,-3),2,3),((0,0),(0,0),(0,0),0,0)]:
    jp.append(warp(T,legs(l1,l2,l3)+head((0,hy)),glob=(0,gy)))
rows['jump']=jp
# dance
dn=[]
for f in range(8):
    ph=2*pi*f/8
    up1=-30*max(0,np.sin(ph)); up2=-24*max(0,np.sin(ph+pi))
    c=legs((-8*max(0,np.sin(ph)),up1),(6*max(0,np.sin(ph+pi)),up2),(0,-6*abs(np.sin(ph))),32)+head((3*np.sin(2*ph),-5*abs(np.sin(2*ph))),44)
    dn.append(warp(T,c,glob=(0,-4*abs(np.sin(ph))),rot=0.12*np.sin(ph)))
rows['dance']=dn
order=['idle','walk','attack','hide','jump','dance']
atlas=np.zeros((FH*len(order),FW*8,4),np.uint8)
for r,name in enumerate(order):
    for f,im in enumerate(rows[name]):
        atlas[r*FH:(r+1)*FH,f*FW:(f+1)*FW]=frame(im)
atlas=outline(atlas,1,(30,18,8))
save(atlas,'turtle_atlas',fmt='webp',q=90)
json.dump({'fw':FW,'fh':FH,'rows':order,'frames':8,'anchor':[0.5,0.945]},open(OUT+'turtle_atlas.json','w'))
# anchor check: feet bottom in frame coords
ys,xs=np.where(atlas[0:FH,0:FW,3]>30); print('frame0 bbox',xs.min(),xs.max(),ys.min(),ys.max())

# ---------- 2. other AI sprites ----------
def simple(name,src,maxw=None,maxh=None,ol=True,keep_largest=True,tol=30):
    a=crop_alpha(cutout(SRC+src,tol=tol,keep_largest=keep_largest))
    if ol: a=outline(a,2,(10,8,20))
    return save(a,name,maxw,maxh)
simple('boss_spider','ai_boss_spider.png',maxw=560,keep_largest=False)
simple('turtle_cyber','ai_turtle_cyber.png',maxw=420,keep_largest=False)
simple('turtle_hover','ai_turtle_hover_back.png',maxw=300,keep_largest=False,tol=22)
simple('fps_paws','ai_fps_paws_blaster.png',maxw=720,ol=False,keep_largest=False)
simple('npc_admin','ai_npc_admin.png',maxh=420,ol=False,keep_largest=False)
sh=crop_alpha(cutout(SRC+'ai_turtle_shell_only.png',keep_largest=True)); save(outline(sh,2,(30,18,8)),'shell',maxw=220)

# enemies sheet: 3x2 grid
E=cutout(SRC+'ai_enemies_sheet.png',min_area=60)
h,w=E.shape[:2]; names=[['hare','snail','drone'],['clerk','ghost','crab']]
for r in range(2):
    for c in range(3):
        cell=E[r*h//2:(r+1)*h//2, c*w//3:(c+1)*w//3]
        save(outline(crop_alpha(cell),2,(10,8,20)),'en_'+names[r][c],maxw=200,maxh=200)

# ---------- 3. backgrounds ----------
for b in ['city','space','ruins','dream']:
    im=Image.open(SRC+f'ai_bg_{b}.png').convert('RGB').resize((960,540),Image.LANCZOS)
    p=OUT+f'bg_{b}.jpg'; im.save(p,quality=80,optimize=True); print(p,os.path.getsize(p)//1024,'KB')
