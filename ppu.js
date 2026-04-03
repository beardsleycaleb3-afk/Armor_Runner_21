/**
 * Pixel Processing Unit (PPU)
 * Mirror Logic: 018810 / Sultan 47
 */
class PPU {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false; // Force crisp pixels
    
    // Virtual OAM (Object Attribute Memory)
    // Layout: [x, y, tileId, attributes]
    this.OAM = new Uint8ClampedArray(256 * 4); 
  }

  /**
   * Attribute Byte Logic (Geometric Data):
   * Bit 7: Mirror X (0=Normal, 1=Mirrored)
   * Bit 6: Mirror Y
   * Bit 5: Priority (0=Below BG, 1=Above BG)
   * Bits 0-4: Palette Bank
   */
  renderSprite(spriteSheet, spriteIndex) {
    const offset = spriteIndex * 4;
    const x = this.OAM[offset];
    const y = this.OAM[offset + 1];
    const tileId = this.OAM[offset + 2];
    const attr = this.OAM[offset + 3];

    const size = 8; // 8x8 SNES Standard
    const sX = (tileId % 16) * size;
    const sY = Math.floor(tileId / 16) * size;

    this.ctx.save();
    
    // Apply Mirroring / Geometric Flip
    const flipX = (attr & 0x80) ? -1 : 1;
    const flipY = (attr & 0x40) ? -1 : 1;
    
    this.ctx.translate(
      x + (flipX === -1 ? size : 0), 
      y + (flipY === -1 ? size : 0)
    );
    this.ctx.scale(flipX, flipY);

    // Draw from "VRAM" (Sprite Sheet)
    this.ctx.drawImage(
      spriteSheet, 
      sX, sY, size, size, 
      0, 0, size, size
    );

    this.ctx.restore();
  }
}
