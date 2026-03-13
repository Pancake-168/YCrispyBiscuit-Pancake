import * as sdk from 'matrix-js-sdk';
import fs from 'fs';

const output = [];

output.push('=== Matrix JS SDK Exports ===');
output.push(Object.keys(sdk).sort().join('\n'));

output.push('\n=== MatrixClient Methods ===');
if (sdk.MatrixClient) {
    const methods = Object.getOwnPropertyNames(sdk.MatrixClient.prototype).sort();
    output.push(methods.join('\n'));
}

output.push('\n=== MatrixEvent Methods ===');
if (sdk.MatrixEvent) {
    const methods = Object.getOwnPropertyNames(sdk.MatrixEvent.prototype).sort();
    output.push(methods.join('\n'));
}

output.push('\n=== MatrixHttpApi Methods ===');
if (sdk.MatrixHttpApi) {
    const methods = Object.getOwnPropertyNames(sdk.MatrixHttpApi.prototype).sort();
    output.push(methods.join('\n'));
}

fs.writeFileSync('matrix_interfaces.txt', output.join('\n'));