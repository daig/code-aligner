"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    console.log('Code Aligner extension is now active');
    // Register the command
    let disposable = vscode.commands.registerCommand('code-aligner.alignCode', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        try {
            // Get alignment delimiters from user
            const delimitersInput = yield vscode.window.showInputBox({
                prompt: 'Enter alignment delimiters separated by spaces (e.g., "operator ( =")',
                placeHolder: 'operator ( =',
                ignoreFocusOut: true
            });
            if (!delimitersInput) {
                return; // User canceled
            }
            const delimiters = delimitersInput.split(' ').filter((d) => d.length > 0);
            if (delimiters.length === 0) {
                vscode.window.showErrorMessage('No valid delimiters provided');
                return;
            }
            // Get selected text
            const selections = editor.selections;
            if (selections.length === 0 || selections[0].isEmpty) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }
            // Apply the alignment
            yield editor.edit((editBuilder) => {
                // Process each selection separately
                for (const selection of selections) {
                    const text = editor.document.getText(selection);
                    const lines = text.split(/\r?\n/);
                    // Align the lines
                    const alignedLines = alignLines(lines, delimiters);
                    // Replace the selection with the aligned text
                    editBuilder.replace(selection, alignedLines.join('\n'));
                }
            });
            vscode.window.showInformationMessage('Code successfully aligned');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
            console.error(error);
        }
    }));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function alignLines(lines, delimiters) {
    if (delimiters.length === 0 || lines.length <= 1) {
        return lines;
    }
    // For each delimiter, find positions
    const positions = [];
    for (let delimiterIndex = 0; delimiterIndex < delimiters.length; delimiterIndex++) {
        const delimiter = delimiters[delimiterIndex];
        const delimiterPositions = [];
        // Find position of current delimiter in each line
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let line = lines[lineIndex];
            // Adjust for previous delimiters that were already processed
            let offset = 0;
            for (let prevIndex = 0; prevIndex < delimiterIndex; prevIndex++) {
                const prevDelimiter = delimiters[prevIndex];
                const prevPosition = positions[prevIndex][lineIndex];
                if (prevPosition !== -1) {
                    offset = prevPosition + prevDelimiter.length;
                    line = line.substring(offset);
                }
            }
            const position = line.indexOf(delimiter);
            delimiterPositions.push(position === -1 ? -1 : position + offset);
        }
        positions.push(delimiterPositions);
    }
    // Align each delimiter
    let result = [...lines];
    for (let delimiterIndex = 0; delimiterIndex < delimiters.length; delimiterIndex++) {
        const delimiter = delimiters[delimiterIndex];
        const delimiterPositions = positions[delimiterIndex];
        // Find the maximum position for current delimiter (for alignment)
        let maxPosition = 0;
        for (const position of delimiterPositions) {
            if (position > maxPosition) {
                maxPosition = position;
            }
        }
        // Skip if no valid positions found
        if (maxPosition === 0) {
            continue;
        }
        // Align each line for current delimiter
        for (let lineIndex = 0; lineIndex < result.length; lineIndex++) {
            const position = delimiterPositions[lineIndex];
            // Skip lines that don't have the delimiter
            if (position === -1) {
                continue;
            }
            // Calculate whitespace needed for alignment
            const spacesNeeded = maxPosition - position;
            // Insert whitespace before the delimiter
            if (spacesNeeded > 0) {
                const beforeDelimiter = result[lineIndex].substring(0, position);
                const afterDelimiter = result[lineIndex].substring(position);
                result[lineIndex] = beforeDelimiter + ' '.repeat(spacesNeeded) + afterDelimiter;
                // Update positions for subsequent delimiters in this line
                for (let nextIndex = delimiterIndex + 1; nextIndex < delimiters.length; nextIndex++) {
                    if (positions[nextIndex][lineIndex] !== -1) {
                        positions[nextIndex][lineIndex] += spacesNeeded;
                    }
                }
            }
        }
    }
    return result;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map