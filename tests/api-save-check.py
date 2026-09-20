"""Integration checks against the explicitly requested local QA server.
Creates isolated guest test saves; never accesses an existing player's cookie.
"""
import sys,json,urllib.request,urllib.error,http.cookiejar,uuid,concurrent.futures
base=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3000/api/game'
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(payload=None):
 req=urllib.request.Request(base,data=json.dumps(payload).encode() if payload else None,headers={'Content-Type':'application/json'})
 try:
  with client.open(req,timeout=20) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def action(name,**kwargs):return {'action':name,'requestId':str(uuid.uuid4()),**kwargs}
s,p=call();assert s==200 and p['player']['coins']==800
req=action('buy-box',box='Rare');s,p=call(req);assert s==200 and p['player']['coins']==100
s,q=call(req);assert s==200 and q['player']['coins']==100 and q['player']['boxes']['Rare']==1
print('PASS Retried purchases are idempotent')
req=action('open-box',box='Rare');s,p=call(req);assert s==200 and p['player']['boxes']['Rare']==0
r=p['result']['reveal'];s,p=call();assert p['player']['pending']['id']==r['id'] and r['characterId'] in p['player']['owned']
print('PASS Reveal and unlocked fighter survive reload before acknowledgement')
s,p=call(action('ack-reveal',id=r['id']));assert s==200 and p['player']['pending'] is None
reqs=[action('open-box',box='Normal'),action('open-box',box='Normal')]
with concurrent.futures.ThreadPoolExecutor() as pool:out=list(pool.map(call,reqs))
assert sum(s==200 for s,p in out)==1
s,p=call();assert p['player']['boxes']['Normal']==0
assert 'receipts' not in p['player']
print('PASS Concurrent box requests consume the box once')
s,p=call(action('buy-box',box='Aether'));assert s==400 and p['player']['coins']==100
print('PASS Invalid spending preserves the saved balance')
