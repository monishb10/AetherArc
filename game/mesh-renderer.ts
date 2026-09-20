/** One shared GPU skinning surface. No WebGL context is created per fighter/frame. */
export class MeshRenderer {
 private canvas:HTMLCanvasElement;private gl:WebGLRenderingContext;private program:WebGLProgram;
 private position:WebGLBuffer;private uv:WebGLBuffer;private index:WebGLBuffer;
 private textures=new Map<HTMLImageElement,WebGLTexture>();
 constructor(){
  this.canvas=document.createElement('canvas');const gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl)throw new Error('WebGL unavailable');this.gl=gl;
  const shader=(type:number,code:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader unavailable');return s;};
  const vertex=shader(gl.VERTEX_SHADER,'attribute vec2 aPosition; attribute vec2 aUV; uniform vec2 uSize; varying vec2 vUV; void main(){vUV=aUV;gl_Position=vec4(aPosition/uSize*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.0,1.0);}');
  const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 vUV; uniform sampler2D uImage; void main(){gl_FragColor=texture2D(uImage,vUV);}');
  this.program=gl.createProgram()!;gl.attachShader(this.program,vertex);gl.attachShader(this.program,fragment);gl.linkProgram(this.program);gl.deleteShader(vertex);gl.deleteShader(fragment);
  if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('Renderer unavailable');
  this.position=gl.createBuffer()!;this.uv=gl.createBuffer()!;this.index=gl.createBuffer()!;
 }
 render(image:HTMLImageElement,positions:Float32Array,uv:Float32Array,indices:Uint16Array,w:number,h:number):HTMLCanvasElement|null {
  const gl=this.gl;if(gl.isContextLost())return null;
  // Render at 2x so mesh edges remain clean on high-density displays.
  this.canvas.width=w*2;this.canvas.height=h*2;gl.viewport(0,0,w*2,h*2);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
  gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
  let texture=this.textures.get(image);
  if(!texture){texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.textures.set(image,texture);
   if(this.textures.size>16){const first=this.textures.keys().next().value!;gl.deleteTexture(this.textures.get(first)!);this.textures.delete(first);}
  }else gl.bindTexture(gl.TEXTURE_2D,texture);
  const attribute=(name:string,buffer:WebGLBuffer,data:Float32Array)=>{gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);const a=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);};
  attribute('aPosition',this.position,positions);attribute('aUV',this.uv,uv);gl.uniform2f(gl.getUniformLocation(this.program,'uSize'),w,h);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  return this.canvas;
 }
}
