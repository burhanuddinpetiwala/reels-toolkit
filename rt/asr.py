import subprocess,numpy as np,json,sys
from faster_whisper import WhisperModel
_m=None
def load(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
def words(path,prompt=None):
    global _m
    if _m is None: _m=WhisperModel('small.en',device='cpu',compute_type='int8')
    segs,_=_m.transcribe(load(path),word_timestamps=True,initial_prompt=prompt,beam_size=5)
    out=[]
    for s in segs:
        for w in s.words: out.append(dict(w=w.word.strip(),s=round(w.start,3),e=round(w.end,3),p=round(w.probability,3)))
    return out
if __name__=='__main__':
    ws=words(sys.argv[1],sys.argv[2] if len(sys.argv)>2 else None)
    if len(sys.argv)>3: json.dump(ws,open(sys.argv[3],'w'),indent=0)
    print(' '.join(f"{w['w']}[{w['s']:.2f}]" for w in ws))
