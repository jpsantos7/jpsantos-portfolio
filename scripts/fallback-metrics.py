# Derives size-adjust and ascent/descent overrides for the fallback @font-face rules in
# src/css/global/fonts.css: average advance width of a fixed English sample in the real
# face at the weight used, divided by the same in the local fallback face.
# Usage: python3 -I scripts/fallback-metrics.py <dir with bricolage.ttf geist.ttf geistmono.ttf
#        fraunces-italic.ttf (the unsubset google/fonts sources)>
# Needs fonttools and macOS system fonts (Arial, Times New Roman, Courier New).
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
import sys
S="/System/Library/Fonts/Supplemental/"
text = (
    "When a team ships a feature, the people who rely on a keyboard or a screen reader are often the last to find out "
    "whether it works. Good interface work starts with plain markup, clear labels and enough contrast, and it keeps "
    "the details small: a focus ring that is easy to see, a heading that says what follows, a form that explains "
    "its own errors. Selected work, Case study, About, Contact. Role: Lead designer. Outcome: fewer support requests "
    "and a faster checkout for everyone. Read the full story of how we rebuilt the booking flow in three months."
)
def avg(font):
    cmap=font.getBestCmap(); hmtx=font['hmtx']; upm=font['head'].unitsPerEm
    tot=sum(hmtx[cmap[ord(c)]][0] for c in text)
    return tot/len(text)/upm, font
def real(path,**axes):
    f=TTFont(path)
    if axes: f=instancer.instantiateVariableFont(f,axes)
    return avg(f)
def sysf(n): return avg(TTFont(S+n))
def info(f):
    upm=f['head'].unitsPerEm;h=f['hhea']
    return h.ascent/upm,-h.descent/upm,h.lineGap/upm
D=sys.argv[1].rstrip("/")+"/"
pairs={
 "heading400":(real(D+"bricolage.ttf",wght=400,wdth=100,opsz=96),sysf("Arial.ttf")),
 "heading800":(real(D+"bricolage.ttf",wght=800,wdth=100,opsz=96),sysf("Arial Bold.ttf")),
 "body400":(real(D+"geist.ttf",wght=400),sysf("Arial.ttf")),
 "body700":(real(D+"geist.ttf",wght=700),sysf("Arial Bold.ttf")),
 "label500":(real(D+"geistmono.ttf",wght=500),sysf("Courier New.ttf")),
 "emph400":(real(D+"fraunces-italic.ttf",wght=400,SOFT=0,WONK=1,opsz=16),sysf("Times New Roman Italic.ttf")),
}
for k,((rw,rf),(fw,ff)) in pairs.items():
    a,d,g=info(rf); fa,fd,fg=info(ff); sa=rw/fw
    print(f"{k}: size-adjust {sa*100:.2f}% ascent {a/sa*100:.2f} descent {d/sa*100:.2f} gap {g/sa*100:.2f}  (arial a{fa:.3f} d{fd:.3f})")
