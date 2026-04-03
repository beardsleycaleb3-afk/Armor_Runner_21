/**
 * Assets: Central Registry for Armor Runner 21.
 * Maps directly to your GitHub folder structure.
 */

export class AssetLoader {
    private images: Map<string, HTMLImageElement> = new Map();
    private loadedCount: number = 0;
    private totalToLoad: number = 0;

    /**
     * Loads a single image or GIF frame
     */
    async load(key: string, path: string): Promise<HTMLImageElement> {
        this.totalToLoad++;
        return new Promise((resolve) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.images.set(key, img);
                this.loadedCount++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Missing asset: ${path}`);
                this.loadedCount++; // Continue anyway to avoid hanging
                resolve(img);
            };
        });
    }

    get(key: string): HTMLImageElement | undefined {
        return this.images.get(key);
    }

    isReady(): boolean {
        return this.totalToLoad > 0 && this.loadedCount === this.totalToLoad;
    }
}

export const assets = new AssetLoader();

/**
 * Global Initialization: Call this once to prime the game.
 */
export const initGameAssets = async () => {
    const jobs: Promise<any>[] = [];

    // 1. Backdrops (1.jpeg - 8.jpeg)
    for (let i = 1; i <= 8; i++) {
        jobs.push(assets.load(`bg_${i}`, `assets/backdrops/${i}.jpeg`));
    }

    // 2. Defenders (d1.png - d4.jpeg) - Handles mixed extensions
    jobs.push(assets.load('def_1', 'assets/defenders/d1.png'));
    jobs.push(assets.load('def_2', 'assets/defenders/d2.jpeg'));
    jobs.push(assets.load('def_3', 'assets/defenders/d3.png'));
    jobs.push(assets.load('def_4', 'assets/defenders/d4.jpeg'));

    // 3. Grass Tiles (grass0.png - grass8.png)
    for (let i = 0; i <= 8; i++) {
        jobs.push(assets.load(`grass_${i}`, `assets/grass/grass${i}.png`));
    }

    // 4. Runner Animations (GIFs)
    jobs.push(assets.load('run_college', 'assets/runner/college1.gif'));
    jobs.push(assets.load('run_down', 'assets/runner/down.gif'));
    jobs.push(assets.load('run_hurdle', 'assets/runner/hurdle1.gif'));

    // 5. Items & Powerups
    jobs.push(assets.load('item_main', 'assets/items/item.png'));
    jobs.push(assets.load('power_main', 'assets/powerups/powerups.png'));

    await Promise.all(jobs);
    console.log("All Armor Runner assets locked and loaded.");
};
