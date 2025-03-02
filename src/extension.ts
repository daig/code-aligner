import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Aligner extension is now active');
    
    // Register the command
    let disposable = vscode.commands.registerCommand('code-aligner.alignCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            // Get alignment delimiters from user
            const delimitersInput = await vscode.window.showInputBox({
                prompt: 'Enter alignment delimiters separated by spaces (e.g., "operator ( =")',
                placeHolder: 'operator ( =',
                ignoreFocusOut: true
            });

            if (!delimitersInput) {
                return; // User canceled
            }

            const delimiters = delimitersInput.split(' ').filter((d: string) => d.length > 0);
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
            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
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
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
            console.error(error);
        }
    });

    context.subscriptions.push(disposable);
}

function alignLines(lines: string[], delimiters: string[]): string[] {
    if (delimiters.length === 0 || lines.length <= 1) {
        return lines;
    }

    // Create a copy of lines to work with
    let result = [...lines];

    // For each delimiter in sequence
    for (let delimIndex = 0; delimIndex < delimiters.length; delimIndex++) {
        const delimiter = delimiters[delimIndex];
        
        // Find the positions of all occurrences of this delimiter in each line
        const occurrencePositions: number[][] = [];
        
        // First, collect all occurrences of the delimiter in each line
        for (let lineIndex = 0; lineIndex < result.length; lineIndex++) {
            const line = result[lineIndex];
            const positions: number[] = [];
            
            let pos = 0;
            while (pos < line.length) {
                const foundPos = line.indexOf(delimiter, pos);
                if (foundPos === -1) break;
                
                positions.push(foundPos);
                pos = foundPos + delimiter.length;
            }
            
            occurrencePositions.push(positions);
        }
        
        // Find the maximum number of occurrences across all lines
        const maxOccurrences = Math.max(...occurrencePositions.map(positions => positions.length));
        
        // Process each occurrence (1st, 2nd, 3rd, etc.)
        for (let occurrenceIndex = 0; occurrenceIndex < maxOccurrences; occurrenceIndex++) {
            // Get position of this occurrence in each line (if it exists)
            const positionsForThisOccurrence: {lineIndex: number, position: number}[] = [];
            
            for (let lineIndex = 0; lineIndex < result.length; lineIndex++) {
                if (occurrencePositions[lineIndex].length > occurrenceIndex) {
                    positionsForThisOccurrence.push({
                        lineIndex,
                        position: occurrencePositions[lineIndex][occurrenceIndex]
                    });
                }
            }
            
            // Skip if no line has this occurrence
            if (positionsForThisOccurrence.length === 0) continue;
            
            // 1. Clean up excess whitespace before the delimiter
            for (const {lineIndex, position} of positionsForThisOccurrence) {
                const line = result[lineIndex];
                
                // Find the preceding non-whitespace character
                let prevNonWhitespacePos = position - 1;
                while (prevNonWhitespacePos >= 0 && /\s/.test(line[prevNonWhitespacePos])) {
                    prevNonWhitespacePos--;
                }
                
                // If we found excessive whitespace
                if (prevNonWhitespacePos < position - 1) {
                    // Keep 1 space if there's a preceding character, or remove all if at line start
                    const spacesToKeep = prevNonWhitespacePos >= 0 ? 1 : 0;
                    const spacesToRemove = position - prevNonWhitespacePos - 1 - spacesToKeep;
                    
                    if (spacesToRemove > 0) {
                        const beforeWhitespace = line.substring(0, prevNonWhitespacePos + 1);
                        const whitespace = ' '.repeat(spacesToKeep);
                        const afterWhitespace = line.substring(position);
                        
                        result[lineIndex] = beforeWhitespace + whitespace + afterWhitespace;
                        
                        // Update positions for this and all subsequent occurrences in this line
                        const adjustment = -spacesToRemove;
                        for (let i = occurrenceIndex; i < occurrencePositions[lineIndex].length; i++) {
                            occurrencePositions[lineIndex][i] += adjustment;
                        }
                    }
                }
            }
            
            // 2. Find the maximum position among all occurrences after cleaning
            const maxPosition = Math.max(
                ...positionsForThisOccurrence.map(({lineIndex}) => 
                    occurrencePositions[lineIndex][occurrenceIndex]
                )
            );
            
            // 3. Add padding to align to the maximum position
            for (const {lineIndex} of positionsForThisOccurrence) {
                const position = occurrencePositions[lineIndex][occurrenceIndex];
                const paddingNeeded = maxPosition - position;
                
                if (paddingNeeded > 0) {
                    const line = result[lineIndex];
                    const beforeDelimiter = line.substring(0, position);
                    const afterDelimiter = line.substring(position);
                    
                    result[lineIndex] = beforeDelimiter + ' '.repeat(paddingNeeded) + afterDelimiter;
                    
                    // Update positions for all subsequent occurrences in this line
                    for (let i = occurrenceIndex; i < occurrencePositions[lineIndex].length; i++) {
                        occurrencePositions[lineIndex][i] += paddingNeeded;
                    }
                }
            }
        }
    }
    
    return result;
}

export function deactivate() {} 