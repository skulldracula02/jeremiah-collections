import fs from 'node:fs'

export default async function capture(page) {
    const outputDirectory = 'C:/Users/asus/Desktop/Jerimiah collections/screenshots'
    fs.mkdirSync(outputDirectory, { recursive: true })

    const views = [
        ['desktop', 1440, 900],
        ['tablet', 1024, 768],
        ['mobile', 390, 844]
    ]

    for (const [name, width, height] of views) {
        await page.setViewportSize({ width, height })
        await page.screenshot({
            path: `${outputDirectory}/${name}.png`,
            fullPage: true
        })
    }

    return { captured: views.map(([name]) => `${name}.png`) }
}
