import fs from "fs"
import util from "util"
import xlsx from "xlsx"

export const getInput = async (filePath, sheetNumber = 0) => {
  const workbook = xlsx.readFile(filePath, { sheetStubs: true })
  const sheetNames = workbook.SheetNames
  const input = workbook.Sheets[sheetNames[sheetNumber]]
  return xlsx.utils.sheet_to_json(input, { defval: "" })
}

export const getNumberOfSheets = (filePath) => {
  const workbook = xlsx.readFile(filePath, { sheetStubs: true })
  return workbook.SheetNames.length
}

export const getColumns = (data) => {
  let headers = []
  const columns = []
  let maxRowLength = 0

  for (const rowItems of data) {
    if (Object.keys(rowItems).length > maxRowLength) {
      headers = [...Object.keys(rowItems)]
      maxRowLength = Object.keys(rowItems).length
    }
  }

  for (const header of headers) {
    const column = [header]
    for (const row of data) {
      const value = row[header] || ""
      column.push(value)
    }
    columns.push(column)
  }

  return columns
}

export const getColumnWidth = (column) => {
  let longest = 0

  for (const element of column) {
    if (element) {
      const elementLength = element.length
      if (elementLength > longest) {
        longest = elementLength
      }
    }
  }

  const columnWidth = longest
  return columnWidth
}

export const getAllColumnWidths = (columns) => {
  const columnWidths = []
  const numberOfColumns = columns.length

  for (let column = 0; column < numberOfColumns; column++) {
    const longest = getColumnWidth(columns[column])
    columnWidths.push(longest)
  }

  return columnWidths
}

export const getHeaderLineBreak = (columnWidths) => {
  let output = ""
  for (let width of columnWidths) {
    // Add three to account for padding on both sides of data and leading |
    width += 3
    output += "|".padEnd(width, "-")
  }
  output += "|\n"
  return output
}

const getOutput = async (input, sheetNumber=0) => {
  const table = await getInput(input, sheetNumber)
    const columns = getColumns(table)
    const columnWidths = getAllColumnWidths(columns)
    let output = ""

    for (let rowIndex = 0; rowIndex < table.length + 1; rowIndex++) {
      const headerRow = rowIndex === 1
      if (headerRow) {
        output += getHeaderLineBreak(columnWidths)
      }

      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        let element = columns[columnIndex][rowIndex] || ""
        element = element.toString()
        const columnWidth = columnWidths[columnIndex]
        output += `| ${element.padEnd(columnWidth, " ")} `
        if (columnIndex === columns.length - 1) {
          output += "|\n"
        }
    }
  }
  return output
}

export const getOutputFilePath = (idx, outputPath) => {
  return outputPath.includes("{number}")
    ? outputPath.replace("{number}", idx)
    : `${outputPath.split(".").slice(0, -1).join(".")}-${idx}.md`
}

export const markdownTables = async (input, options) => {
  try {
    if (options?.allSheets) {
      const outputs = []
      const numberOfSheets = getNumberOfSheets(input)
      for (let sheetNumber = 0; sheetNumber < numberOfSheets; sheetNumber++) {
        const output = await getOutput(input, sheetNumber)
        outputs.push(output)
        if (options.outputPath) {
          const outputPath = getOutputFilePath(sheetNumber, options.outputPath)
          const write = util.promisify(fs.writeFile)
          await write(outputPath, output)
          // eslint-disable-next-line no-console
          console.log(`The file was written to ${outputPath}`)
        }
      }
      return outputs
    } else {
      const output = await getOutput(input)
      if (options?.outputPath) {
        const write = util.promisify(fs.writeFile)
        await write(options.outputPath, output)
        // eslint-disable-next-line no-console
        console.log(`The file was written to ${options.outputPath}`)
      }
      return output
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    throw error
  }
}
