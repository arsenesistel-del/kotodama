# Détourage des images générées : art/raw -> src/assets/combat (WebP). Lancer depuis la racine du dépôt.
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
R='art/raw/'; O='src/assets/combat/'
def sprite(name, out, h, solid=0.9):
    im=np.asarray(Image.open(R+name).convert('RGB')).astype(np.float32)/255
    mx=im.max(axis=2)
    a=np.clip((mx-0.045)/0.33,0,1)
    mask=mx>0.10
    mask=ndi.binary_closing(mask,iterations=5); mask=ndi.binary_fill_holes(mask)
    mask=ndi.binary_opening(mask,iterations=2)
    # garder les gros morceaux
    lab,n=ndi.label(mask); 
    if n>1:
        sz=ndi.sum(mask,lab,range(1,n+1)); keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>sz.max()*0.02]); mask=keep
    soft=ndi.gaussian_filter(mask.astype(np.float32),2.0)
    alpha=np.maximum(a, soft*solid)
    ys,xs=np.where(alpha>0.05); pad=8
    y0,y1,x0,x1=max(ys.min()-pad,0),min(ys.max()+pad,im.shape[0]),max(xs.min()-pad,0),min(xs.max()+pad,im.shape[1])
    rgb=np.clip(im/np.maximum(alpha[...,None],0.35),0,1)
    rgba=np.dstack([rgb,alpha])[y0:y1,x0:x1]
    img=Image.fromarray((rgba*255).astype(np.uint8),'RGBA')
    w=round(img.width*h/img.height); img=img.resize((w,h),Image.LANCZOS)
    img.save(O+out,'WEBP',quality=80,method=6)
    print(out,img.size,os.path.getsize(O+out))
ONLY=set(sys.argv[1:])
def want(o): return not ONLY or o in ONLY
for n,o in [('m1_kake','kake'),('m2_kuzure','kuzure'),('m3_yuragi','yuragi'),('m4_tsutae','tsutae'),('m5_wake','wake'),('m6_ou','ou'),('m7_kiri','kiri'),('m8_tsubu','tsubu'),('m9_mayoi','mayoi')]:
    if want(o): sprite(n+'.png',o+'.webp',600)
# Les 言蟲 (session 10) : petites bêtes des herbes hautes, une par fin du chapitre 1.
for n,o in [('k1_tsubuyaki','k_tsubu'),('k2_uwasa','k_uwasa'),('k3_mayoiga','k_mayoi'),('k4_wakegitsune','k_wake')]:
    if want(o): sprite(n+'.png',o+'.webp',360)
if ONLY: sys.exit(0)
sprite('p_ready.png','p_ready.webp',520,0.95); sprite('p_slash.png','p_slash.webp',520,0.6)
for n in ['bg_temple','bg_village']:
    im=Image.open(R+n+'.png').convert('RGB'); im.save(O+n+'.webp','WEBP',quality=72,method=6); print(n,os.path.getsize(O+n+'.webp'))
# planche de contrôle sur fond gris-bleu
names=['kake','kuzure','yuragi','tsutae','wake','ou','p_ready','p_slash']
sheet=Image.new('RGB',(4*420,2*420),(40,60,70))
for i,n in enumerate(names):
    s=Image.open(O+n+'.webp'); s.thumbnail((400,400)); sheet.paste(s,(i%4*420+10,i//4*420+10),s)
sheet.save('/tmp/sheet.jpg',quality=85)
