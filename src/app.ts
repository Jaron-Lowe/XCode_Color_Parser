import * as Path from 'path'
import * as FileSystem from 'fs'
import { Storyboard } from './models/Storyboard.js'
import { GroupedColor } from './models/GroupedColor.js'
import { XCColorContent, XCContent } from './models/XCModels.js'
import { NamedAssetColor } from './models/NamedColor.js'

const rootPath = `/Users/jarolowe/Code/cnb-mobile-ios/CNBMobile/`
const outputPath = `/Users/jarolowe/Desktop/Outputs`

const colorAssetFilePaths = findFilePaths(rootPath, [".json"], ".colorset")
const assetColors = extractAssetColors(colorAssetFilePaths)
const viewFilePaths = findFilePaths(rootPath, [".storyboard", ".xib"])
const viewFiles = extractViewFileContents(viewFilePaths)
const groupedColors = groupColors(assetColors, viewFiles)
generateXCAssets(groupedColors)
generateHTMLSample(groupedColors)

// Parses the closest parent directory component from a path.
function parentDirectoryName(path: string) : string {
    const subDirectories = Path.dirname(path).split(Path.sep).filter((x) => { return x !== "" })
    if (subDirectories.length > 0) {
        return subDirectories[subDirectories.length-1]
    }
    return ""
}

// Returns a list of NamedAssetColors from a list of file paths.
function extractAssetColors(paths: string[]) : NamedAssetColor[] {
    let assetColors = []
    for (const path of paths) {
        try {
            const parentDirectory = parentDirectoryName(path)
            const parentDirectoryParts = parentDirectory.split(".")
            parentDirectoryParts.pop()
            const colorName = parentDirectoryParts.join(".")
            const fileText = FileSystem.readFileSync(path, { encoding: "utf-8" });
            const jsonData = JSON.parse(fileText)
            const assetContent = new XCColorContent(jsonData)
            const assetColor = assetContent.parsedAnyIdiomColor()
            if (assetColor) {
                const namedColor = new NamedAssetColor(colorName, assetColor)
                assetColors.push(namedColor)
            }
        }
        catch (error) {
            console.log(`Could not extract asset color at path: ${path}: ${error}`)
        }
    }
    return assetColors
}

// Recursively searches directories files of the specified file types and returns an array of their paths.
function findFilePaths(path: string, types: string[], parentDirectoryExt?: string) : string[] {
    let paths: string[] = []
    try {
        const listItems = FileSystem.readdirSync(path, { withFileTypes: true })
        let subPaths: string[] = []
        for (const item of listItems) {
            if (item.isFile() && types.includes(Path.extname(item.name)) && (!parentDirectoryExt || (parentDirectoryExt && path.includes(parentDirectoryExt)))) {
                const fullPath = Path.join(path, item.name)
                paths.push(fullPath)
            }
            if (item.isDirectory()) {
                subPaths = [...subPaths, ...findFilePaths(Path.join(path, item.name), types, parentDirectoryExt)]
            }
        }
        paths = [...paths, ...subPaths]
    }
    catch (error) {
        console.log(`Could not read directory at path: ${path}: ${error}`)
    }
    return paths
}

// Extracts view file contents from a list of file paths.
function extractViewFileContents(paths: string[]) : Storyboard[] {
    let storyboards: Storyboard[] = []
    for (const path of paths) {
        try {
            const fileText = FileSystem.readFileSync(path, { encoding: "utf-8" })
            const storyboard = new Storyboard(Path.basename(path), fileText)
            storyboards.push(storyboard)
        }
        catch (error) {
            console.log(`Could not extract view file at path: ${path}: ${error}`)
        }
    }
    return storyboards
}

// Returns a list of grouped colors from a list of storyboards.
function groupColors(assetColors: NamedAssetColor[], storyboards: Storyboard[]) : GroupedColor[] {
    let groupedColors: GroupedColor[] = []

    // Group colors from Assets
    for (const namedColor of assetColors) {
        let groupedColor = groupedColors.find((x) => {
            return x.rawValue === namedColor.color.rawValue()
        })
        if (groupedColor) {
            groupedColor.addNamedColor(namedColor)
        } 
        else {
            const newGroupedColor = new GroupedColor()
            newGroupedColor.addNamedColor(namedColor)
            groupedColors.push(newGroupedColor)
        }
    }

    // Group Named colors from storyboards
    for (const storyboard of storyboards) {
        for (const namedColor of storyboard.namedColors) {
            let groupedColor = groupedColors.find((x) => {
                return x.rawValue === namedColor.color.rawValue()
            })
            if (groupedColor) {
                groupedColor.addNamedColor(namedColor)
            } 
            else {
                const newGroupedColor = new GroupedColor()
                newGroupedColor.addNamedColor(namedColor)
                groupedColors.push(newGroupedColor)
            }
        }
    }

    // Group unnamed colors from 
    for (const storyboard of storyboards) {
        for (const color of storyboard.colors) {
            let groupedColor = groupedColors.find((x) => {
                return x.rawValue === color.rawValue()
            })
            if (groupedColor) {
                groupedColor.addColor(color)
            }
            else {
                const newGroupedColor = new GroupedColor()
                newGroupedColor.addColor(color)
                groupedColors.push(newGroupedColor)
            }
        }
    }
    return groupedColors
}

// Generates a .xcassets directory at the output path.
function generateXCAssets(groupedColors: GroupedColor[]) : void {
    // Create output xcassets directory
    const outputAssetsPath = Path.join(outputPath, "Colors.xcassets")
    if (FileSystem.existsSync(outputAssetsPath)) {
        FileSystem.rmSync(outputAssetsPath, { recursive: true } )
    }
    FileSystem.mkdirSync(outputAssetsPath, { recursive: true })

    // Create Contents.json file in root directory
    const contentsJson = JSON.stringify(new XCContent(), null, "  ")
    FileSystem.writeFileSync(Path.join(outputAssetsPath, "Contents.json"), contentsJson)

    let tbdCount = 0
    for (const color of groupedColors) {
        const finalName = color.outputName()
        let tbdValue = ""
        if (finalName === "tbd") { 
            tbdCount += 1 
            tbdValue = "-" + `${tbdCount}`.padStart(3, "0")
        }
        const colorName = `${finalName}${tbdValue}.colorset`
        const colorPath = Path.join(outputAssetsPath, colorName)
        FileSystem.mkdirSync(colorPath)
        const colorContentsJson = JSON.stringify(XCColorContent.withColor(color.rawValue), null, "  ")
        FileSystem.writeFileSync(Path.join(colorPath, "Contents.json"), colorContentsJson)
    }
}

// Generates an HTML file sampling a list of grouped colors at the output path.
function generateHTMLSample(groupedColors: GroupedColor[]) : void {
    let tableContents = ""
    let tbdCount = 0

    const sortedColors = groupedColors.sort((a, b) => {
        const valueA = a.outputName()
        const valueB = b.outputName()
        return valueA.localeCompare(valueB, undefined, { numeric: true })
    })
    for (const color of sortedColors) {
        let cellsContent = ""
        const finalName = color.outputName()
        let tbdValue = ""
        if (finalName === "tbd") { 
            tbdCount += 1 
            tbdValue = "-" + `${tbdCount}`.padStart(3, "0")
        }
        const colorName = `${finalName}${tbdValue}`
        tableContents += `
            <tr>
                <td style="background: ${color.rawValue}"></td>
                <td>${color.rawValue}</td>
                <td>${colorName}</td>
                <td>${color.colors.length}</td>
            </tr>
        `
    }
    const htmlOutput = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    html, body {
                        margin: 0;
                        font-family: sans-serif;
                    }

                    table {
                        margin: 0px auto;
                        border: 1px solid #000;
                        border-collapse: collapse;
                        width: 100%;
                        max-width: 900px;
                    }

                    td, th {
                        border: 1px solid #000;
                        padding: 16px;
                    }
                </style>
            </head>
            <body>
                <table>
                    <tr>
                        <th>Color</th>
                        <th>Raw Value</th>
                        <th>Color Name</th>
                        <th>Uses*</th>
                    </tr>
                    ${tableContents}
                </table>
                <div style="padding: 1em; text-align: center;">* The count of uses does not include direct uses in source code.</div>
            </body
        </html>
    `
    FileSystem.writeFileSync(Path.join(outputPath, "sample.html"), htmlOutput)
}

let tbdCount = 0
let outputs = groupedColors.map((x) => { 
    const finalName = x.debugName()
    let tbdValue = ""
    if (finalName === "tbd") { 
        tbdCount += 1 
        tbdValue = "-" + `${tbdCount}`.padStart(3, "0")
    }
    return `${finalName}${tbdValue} - ${x.colors.length} IB uses - ${x.rawValue}` 
})

console.log(groupedColors)
console.log(outputs.sort())
console.log("DONE")