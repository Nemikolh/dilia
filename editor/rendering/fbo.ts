import {Command} from './interfaces';
import {Context} from './context';
import {Texture} from '../gl/tex';


export const DefaultFBO = (ctx: Context) => {
    ctx.gl.bindFramebuffer(ctx.gl.FRAMEBUFFER, null);
};


export class FBO implements Command {

    private fbo: WebGLFramebuffer;
    private texture: Texture;

    constructor(
        private gl: WebGLRenderingContext
    ) {
        // TODO: Remove cast and handle the error somehow.
        this.fbo = this.gl.createFramebuffer() as WebGLFramebuffer;
        this.texture = new Texture();
        // TODO: Remove cast and handle the error somehow.
        this.texture.tex_id = this.gl.createTexture() as WebGLTexture;
    }

    getTexture(): Texture {
        return this.texture;
    }

    setSize(width: number, height: number) {
        let gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture.tex_id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // LINEAR OR NEAREST ?
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // Allocate texture.
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // level
            gl.RGBA,            // internalformat
            width, height,      // width, height
            0,                  // border
            gl.RGBA,            // format
            gl.UNSIGNED_BYTE,   // type
            undefined           // pixels (ArrayBufferView)
        );
        this.use();
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,         // target
            gl.COLOR_ATTACHMENT0,   // attachment
            gl.TEXTURE_2D,          // textarget
            this.texture.tex_id,    // texture
            0                       // level
        );
        this.texture.width = width;
        this.texture.height = height;
    }

    execute(_ctx: Context) {
        this.use();
    }

    use() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    }
}
