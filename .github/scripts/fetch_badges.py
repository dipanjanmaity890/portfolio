import asyncio
import json
import os
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        # Launch headless browser
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to g.dev/DIPANJANMAITY...")
        await page.goto("https://g.dev/DIPANJANMAITY", wait_until="domcontentloaded")
        # Wait specifically for the first badge image to appear, or timeout after 10s
        try:
            await page.wait_for_selector("img[src*='badge']", timeout=10000)
        except Exception:
            print("Warning: Timed out waiting for badge selector, proceeding to extract anyway...")
            await page.wait_for_timeout(3000)
        
        # Extract badges
        print("Extracting badges...")
        badges = await page.evaluate('''() => {
            const images = Array.from(document.querySelectorAll('img'));
            // Filter images that have 'badge' or 'learnings' in their src (typical Google badges)
            return images
                .filter(img => img.src.includes('badge') || img.src.includes('learnings'))
                .map(img => ({
                    src: img.src,
                    alt: img.alt || "Google Developer Badge"
                }));
        }''')
        
        # Filter duplicates
        unique_badges = []
        seen_srcs = set()
        for b in badges:
            if b['src'] not in seen_srcs:
                unique_badges.append(b)
                seen_srcs.add(b['src'])
        
        print(f"Found {len(unique_badges)} unique badges.")
        
        # Ensure the public directory exists
        os.makedirs("public", exist_ok=True)
        
        # Write to public/badges.json
        with open("public/badges.json", "w") as f:
            json.dump(unique_badges, f, indent=2)
            
        print("Successfully saved to public/badges.json")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
