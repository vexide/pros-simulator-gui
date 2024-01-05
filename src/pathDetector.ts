// enterprise code is wild on god

/*
MIT License

Copyright (c) 2015 - present Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import type {
    IBuffer,
    IBufferCellPosition,
    IBufferLine,
    IBufferRange,
    ILink,
    ILinkProvider,
    Terminal,
} from "@xterm/xterm";

let _isWindows = false;
let _isMacintosh = false;
let _isLinux = false;
let _isLinuxSnap = false;
let _isNative = false;
let _isWeb = false;
let _isElectron = false;
let _isIOS = false;
let _isCI = false;
let _isMobile = false;
let _userAgent: string | undefined = undefined;

interface NLSConfig {
    locale: string;
    osLocale: string;
    availableLanguages: { [key: string]: string };
    _translationsConfigFile: string;
}

export interface IProcessEnvironment {
    [key: string]: string | undefined;
}

/**
 * This interface is intentionally not identical to node.js
 * process because it also works in sandboxed environments
 * where the process object is implemented differently. We
 * define the properties here that we need for `platform`
 * to work and nothing else.
 */
export interface INodeProcess {
    platform: string;
    arch: string;
    env: IProcessEnvironment;
    versions?: {
        electron?: string;
        chrome?: string;
    };
    type?: string;
    cwd: () => string;
}

declare const process: INodeProcess;

const $globalThis: any = globalThis;

let nodeProcess: INodeProcess | undefined = undefined;
if (
    typeof $globalThis.vscode !== "undefined" &&
    typeof $globalThis.vscode.process !== "undefined"
) {
    // Native environment (sandboxed)
    nodeProcess = $globalThis.vscode.process;
} else if (typeof process !== "undefined") {
    // Native environment (non-sandboxed)
    nodeProcess = process;
}

const isElectronProcess = typeof nodeProcess?.versions?.electron === "string";
const isElectronRenderer =
    isElectronProcess && nodeProcess?.type === "renderer";

interface INavigator {
    userAgent: string;
    maxTouchPoints?: number;
    language: string;
}
declare const navigator: INavigator;

// Native environment
if (typeof nodeProcess === "object") {
    _isWindows = nodeProcess.platform === "win32";
    _isMacintosh = nodeProcess.platform === "darwin";
    _isLinux = nodeProcess.platform === "linux";
    _isLinuxSnap =
        _isLinux &&
        !!nodeProcess.env["SNAP"] &&
        !!nodeProcess.env["SNAP_REVISION"];
    _isElectron = isElectronProcess;
    _isCI =
        !!nodeProcess.env["CI"] ||
        !!nodeProcess.env["BUILD_ARTIFACTSTAGINGDIRECTORY"];
    _isNative = true;
}

// Web environment
else if (typeof navigator === "object" && !isElectronRenderer) {
    _userAgent = navigator.userAgent;
    _isWindows = _userAgent.indexOf("Windows") >= 0;
    _isMacintosh = _userAgent.indexOf("Macintosh") >= 0;
    _isIOS =
        (_userAgent.indexOf("Macintosh") >= 0 ||
            _userAgent.indexOf("iPad") >= 0 ||
            _userAgent.indexOf("iPhone") >= 0) &&
        !!navigator.maxTouchPoints &&
        navigator.maxTouchPoints > 0;
    _isLinux = _userAgent.indexOf("Linux") >= 0;
    _isMobile = _userAgent?.indexOf("Mobi") >= 0;
    _isWeb = true;
}

// Unknown environment
else {
    console.error("Unable to resolve platform.");
}

export const enum Platform {
    Web,
    Mac,
    Linux,
    Windows,
}
export type PlatformName = "Web" | "Windows" | "Mac" | "Linux";

export function PlatformToString(platform: Platform): PlatformName {
    switch (platform) {
        case Platform.Web:
            return "Web";
        case Platform.Mac:
            return "Mac";
        case Platform.Linux:
            return "Linux";
        case Platform.Windows:
            return "Windows";
    }
}

let _platform: Platform = Platform.Web;
if (_isMacintosh) {
    _platform = Platform.Mac;
} else if (_isWindows) {
    _platform = Platform.Windows;
} else if (_isLinux) {
    _platform = Platform.Linux;
}

export const isWindows = _isWindows;
export const isMacintosh = _isMacintosh;
export const isLinux = _isLinux;
export const isLinuxSnap = _isLinuxSnap;
export const isNative = _isNative;
export const isElectron = _isElectron;
export const isWeb = _isWeb;
export const isWebWorker =
    _isWeb && typeof $globalThis.importScripts === "function";
export const webWorkerOrigin = isWebWorker ? $globalThis.origin : undefined;
export const isIOS = _isIOS;
export const isMobile = _isMobile;
/**
 * Whether we run inside a CI environment, such as
 * GH actions or Azure Pipelines.
 */
export const isCI = _isCI;
export const platform = _platform;
export const userAgent = _userAgent;

export const OS =
    _isMacintosh || _isIOS
        ? OperatingSystem.Macintosh
        : _isWindows
          ? OperatingSystem.Windows
          : OperatingSystem.Linux;

export interface IActivateLinkEvent {
    link: ITerminalSimpleLink;
    event?: MouseEvent;
}

export type XtermLinkMatcherHandler = (
    event: MouseEvent | undefined,
    link: ITerminalSimpleLink,
) => void;

/**
 * Wrap a link detector object so it can be used in xterm.js
 */
export class TerminalLinkDetectorAdapter implements ILinkProvider {
    private _activeLinks: ILink[] | undefined;

    constructor(
        private readonly _detector: ITerminalLinkDetector,
        private readonly onClick: XtermLinkMatcherHandler,
    ) {}

    async provideLinks(
        bufferLineNumber: number,
        callback: (links: ILink[] | undefined) => void,
    ) {
        callback(this._provideLinks(bufferLineNumber));
    }

    private _provideLinks(bufferLineNumber: number): ILink[] {
        // Dispose of all old links if new links are provided, links are only cached for the current line
        const links: ILink[] = [];

        let startLine = bufferLineNumber - 1;
        let endLine = startLine;

        const lines: IBufferLine[] = [
            this._detector.xterm.buffer.active.getLine(startLine)!,
        ];

        // Cap the maximum context on either side of the line being provided, by taking the context
        // around the line being provided for this ensures the line the pointer is on will have
        // links provided.
        const maxLineContext = Math.max(
            this._detector.maxLinkLength / this._detector.xterm.cols,
        );
        const minStartLine = Math.max(startLine - maxLineContext, 0);
        const maxEndLine = Math.min(
            endLine + maxLineContext,
            this._detector.xterm.buffer.active.length,
        );

        while (
            startLine >= minStartLine &&
            this._detector.xterm.buffer.active.getLine(startLine)?.isWrapped
        ) {
            lines.unshift(
                this._detector.xterm.buffer.active.getLine(startLine - 1)!,
            );
            startLine--;
        }

        while (
            endLine < maxEndLine &&
            this._detector.xterm.buffer.active.getLine(endLine + 1)?.isWrapped
        ) {
            lines.push(
                this._detector.xterm.buffer.active.getLine(endLine + 1)!,
            );
            endLine++;
        }

        const detectedLinks = this._detector.detect(lines, startLine, endLine);
        for (const link of detectedLinks) {
            links.push(this._createTerminalLink(link, this.onClick));
        }

        return links;
    }

    private _createTerminalLink(
        l: ITerminalSimpleLink,
        activateCallback: XtermLinkMatcherHandler,
    ): ILink {
        // Remove trailing colon if there is one so the link is more useful
        if (
            !l.disableTrimColon &&
            l.text.length > 0 &&
            l.text.charAt(l.text.length - 1) === ":"
        ) {
            l.text = l.text.slice(0, -1);
            l.bufferRange.end.x--;
        }
        return {
            range: l.bufferRange,
            text: l.text,
            activate: (event: MouseEvent | undefined) => {
                activateCallback(event, l);
            },
        };
    }
}

export const enum OperatingSystem {
    Windows = 1,
    Macintosh = 2,
    Linux = 3,
}

/**
 * This module is responsible for parsing possible links out of lines with only access to the line
 * text and the target operating system, ie. it does not do any validation that paths actually
 * exist.
 */

export interface IParsedLink {
    path: ILinkPartialRange;
    prefix?: ILinkPartialRange;
    suffix?: ILinkSuffix;
}

export interface ILinkSuffix {
    row: number | undefined;
    col: number | undefined;
    rowEnd: number | undefined;
    colEnd: number | undefined;
    suffix: ILinkPartialRange;
}

export interface ILinkPartialRange {
    index: number;
    text: string;
}

/**
 * A regex that extracts the link suffix which contains line and column information. The link suffix
 * must terminate at the end of line.
 */
const linkSuffixRegexEol = generateLinkSuffixRegex(true);
/**
 * A regex that extracts the link suffix which contains line and column information.
 */
const linkSuffixRegex = generateLinkSuffixRegex(false);

function generateLinkSuffixRegex(eolOnly: boolean) {
    let ri = 0;
    let ci = 0;
    let rei = 0;
    let cei = 0;
    function r(): string {
        return `(?<row${ri++}>\\d+)`;
    }
    function c(): string {
        return `(?<col${ci++}>\\d+)`;
    }
    function re(): string {
        return `(?<rowEnd${rei++}>\\d+)`;
    }
    function ce(): string {
        return `(?<colEnd${cei++}>\\d+)`;
    }

    const eolSuffix = eolOnly ? "$" : "";

    // The comments in the regex below use real strings/numbers for better readability, here's
    // the legend:
    // - Path    = foo
    // - Row     = 339
    // - Col     = 12
    // - RowEnd  = 341
    // - ColEnd  = 789
    //
    // These all support single quote ' in the place of " and [] in the place of ()
    //
    // See the tests for an exhaustive list of all supported formats
    const lineAndColumnRegexClauses = [
        // foo:339
        // foo:339:12
        // foo:339:12-789
        // foo:339:12-341.789
        // foo:339.12
        // foo 339
        // foo 339:12                              [#140780]
        // foo 339.12
        // foo#339
        // foo#339:12                              [#190288]
        // foo#339.12
        // "foo",339
        // "foo",339:12
        // "foo",339.12
        // "foo",339.12-789
        // "foo",339.12-341.789
        `(?::|#| |['"],)${r()}([:.]${c()}(?:-(?:${re()}\\.)?${ce()})?)?` +
            eolSuffix,
        // The quotes below are optional           [#171652]
        // "foo", line 339                         [#40468]
        // "foo", line 339, col 12
        // "foo", line 339, column 12
        // "foo":line 339
        // "foo":line 339, col 12
        // "foo":line 339, column 12
        // "foo": line 339
        // "foo": line 339, col 12
        // "foo": line 339, column 12
        // "foo" on line 339
        // "foo" on line 339, col 12
        // "foo" on line 339, column 12
        // "foo" line 339 column 12
        // "foo", line 339, character 12           [#171880]
        // "foo", line 339, characters 12-789      [#171880]
        // "foo", lines 339-341                    [#171880]
        // "foo", lines 339-341, characters 12-789 [#178287]
        `['"]?(?:,? |: ?| on )lines? ${r()}(?:-${re()})?(?:,? (?:col(?:umn)?|characters?) ${c()}(?:-${ce()})?)?` +
            eolSuffix,
        // foo(339)
        // foo(339,12)
        // foo(339, 12)
        // foo (339)
        //   ...
        // foo: (339)
        //   ...
        `:? ?[\\[\\(]${r()}(?:, ?${c()})?[\\]\\)]` + eolSuffix,
    ];

    const suffixClause = lineAndColumnRegexClauses
        // Join all clauses together
        .join("|")
        // Convert spaces to allow the non-breaking space char (ascii 160)
        .replace(/ /g, `[${"\u00A0"} ]`);

    return new RegExp(`(${suffixClause})`, eolOnly ? undefined : "g");
}

/**
 * Removes the optional link suffix which contains line and column information.
 * @param link The link to use.
 */
export function removeLinkSuffix(link: string): string {
    const suffix = getLinkSuffix(link)?.suffix;
    if (!suffix) {
        return link;
    }
    return link.substring(0, suffix.index);
}

/**
 * Removes any query string from the link.
 * @param link The link to use.
 */
export function removeLinkQueryString(link: string): string {
    // Skip ? in UNC paths
    const start = link.startsWith("\\\\?\\") ? 4 : 0;
    const index = link.indexOf("?", start);
    if (index === -1) {
        return link;
    }
    return link.substring(0, index);
}

export function detectLinkSuffixes(line: string): ILinkSuffix[] {
    // Find all suffixes on the line. Since the regex global flag is used, lastIndex will be updated
    // in place such that there are no overlapping matches.
    let match: RegExpExecArray | null;
    const results: ILinkSuffix[] = [];
    linkSuffixRegex.lastIndex = 0;
    while ((match = linkSuffixRegex.exec(line)) !== null) {
        const suffix = toLinkSuffix(match);
        if (suffix === null) {
            break;
        }
        results.push(suffix);
    }
    return results;
}

/**
 * Returns the optional link suffix which contains line and column information.
 * @param link The link to parse.
 */
export function getLinkSuffix(link: string): ILinkSuffix | null {
    return toLinkSuffix(linkSuffixRegexEol.exec(link));
}

export function toLinkSuffix(
    match: RegExpExecArray | null,
): ILinkSuffix | null {
    const groups = match?.groups;
    if (!groups || match.length < 1) {
        return null;
    }
    return {
        row: parseIntOptional(groups.row0 || groups.row1 || groups.row2),
        col: parseIntOptional(groups.col0 || groups.col1 || groups.col2),
        rowEnd: parseIntOptional(
            groups.rowEnd0 || groups.rowEnd1 || groups.rowEnd2,
        ),
        colEnd: parseIntOptional(
            groups.colEnd0 || groups.colEnd1 || groups.colEnd2,
        ),
        suffix: { index: match.index, text: match[0] },
    };
}

function parseIntOptional(value: string | undefined): number | undefined {
    if (value === undefined) {
        return value;
    }
    return parseInt(value);
}

// This defines valid path characters for a link with a suffix, the first `[]` of the regex includes
// characters the path is not allowed to _start_ with, the second `[]` includes characters not
// allowed at all in the path. If the characters show up in both regexes the link will stop at that
// character, otherwise it will stop at a space character.
const linkWithSuffixPathCharacters =
    /(?<path>(?:file:\/\/\/)?[^\s\|<>\[\({][^\s\|<>]*)$/;

export function detectLinks(line: string, os: OperatingSystem) {
    // 1: Detect all links on line via suffixes first
    const results = detectLinksViaSuffix(line);

    // 2: Detect all links without suffixes and merge non-conflicting ranges into the results
    const noSuffixPaths = detectPathsNoSuffix(line, os);
    binaryInsertList(results, noSuffixPaths);

    return results;
}

function binaryInsertList(list: IParsedLink[], newItems: IParsedLink[]) {
    if (list.length === 0) {
        list.push(...newItems);
    }
    for (const item of newItems) {
        binaryInsert(list, item, 0, list.length);
    }
}

function binaryInsert(
    list: IParsedLink[],
    newItem: IParsedLink,
    low: number,
    high: number,
) {
    if (list.length === 0) {
        list.push(newItem);
        return;
    }
    if (low > high) {
        return;
    }
    // Find the index where the newItem would be inserted
    const mid = Math.floor((low + high) / 2);
    if (
        mid >= list.length ||
        (newItem.path.index < list[mid].path.index &&
            (mid === 0 || newItem.path.index > list[mid - 1].path.index))
    ) {
        // Check if it conflicts with an existing link before adding
        if (
            mid >= list.length ||
            (newItem.path.index + newItem.path.text.length <
                list[mid].path.index &&
                (mid === 0 ||
                    newItem.path.index >
                        list[mid - 1].path.index +
                            list[mid - 1].path.text.length))
        ) {
            list.splice(mid, 0, newItem);
        }
        return;
    }
    if (newItem.path.index > list[mid].path.index) {
        binaryInsert(list, newItem, mid + 1, high);
    } else {
        binaryInsert(list, newItem, low, mid - 1);
    }
}

function detectLinksViaSuffix(line: string): IParsedLink[] {
    const results: IParsedLink[] = [];

    // 1: Detect link suffixes on the line
    const suffixes = detectLinkSuffixes(line);
    for (const suffix of suffixes) {
        const beforeSuffix = line.substring(0, suffix.suffix.index);
        const possiblePathMatch = beforeSuffix.match(
            linkWithSuffixPathCharacters,
        );
        if (
            possiblePathMatch &&
            possiblePathMatch.index !== undefined &&
            possiblePathMatch.groups?.path
        ) {
            let linkStartIndex = possiblePathMatch.index;
            let path = possiblePathMatch.groups.path;
            // Extract a path prefix if it exists (not part of the path, but part of the underlined
            // section)
            let prefix: ILinkPartialRange | undefined = undefined;
            const prefixMatch = path.match(/^(?<prefix>['"]+)/);
            if (prefixMatch?.groups?.prefix) {
                prefix = {
                    index: linkStartIndex,
                    text: prefixMatch.groups.prefix,
                };
                path = path.substring(prefix.text.length);

                // If there are multiple characters in the prefix, trim the prefix if the _first_
                // suffix character is the same as the last prefix character. For example, for the
                // text `echo "'foo' on line 1"`:
                //
                // - Prefix='
                // - Path=foo
                // - Suffix=' on line 1
                //
                // If this fails on a multi-character prefix, just keep the original.
                if (prefixMatch.groups.prefix.length > 1) {
                    if (
                        suffix.suffix.text[0].match(/['"]/) &&
                        prefixMatch.groups.prefix[
                            prefixMatch.groups.prefix.length - 1
                        ] === suffix.suffix.text[0]
                    ) {
                        const trimPrefixAmount =
                            prefixMatch.groups.prefix.length - 1;
                        prefix.index += trimPrefixAmount;
                        prefix.text =
                            prefixMatch.groups.prefix[
                                prefixMatch.groups.prefix.length - 1
                            ];
                        linkStartIndex += trimPrefixAmount;
                    }
                }
            }
            results.push({
                path: {
                    index: linkStartIndex + (prefix?.text.length || 0),
                    text: path,
                },
                prefix,
                suffix,
            });
        }
    }

    return results;
}

enum RegexPathConstants {
    PathPrefix = "(?:\\.\\.?|\\~|file://)",
    PathSeparatorClause = "\\/",
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24795
    ExcludedPathCharactersClause = "[^\\0<>\\?\\s!`&*()'\":;\\\\]",
    ExcludedStartPathCharactersClause = "[^\\0<>\\s!`&*()\\[\\]'\":;\\\\]",

    WinOtherPathPrefix = "\\.\\.?|\\~",
    WinPathSeparatorClause = "(?:\\\\|\\/)",
    WinExcludedPathCharactersClause = "[^\\0<>\\?\\|\\/\\s!`&*()'\":;]",
    WinExcludedStartPathCharactersClause = "[^\\0<>\\?\\|\\/\\s!`&*()\\[\\]'\":;]",
}

/**
 * A regex that matches non-Windows paths, such as `/foo`, `~/foo`, `./foo`, `../foo` and
 * `foo/bar`.
 */
const unixLocalLinkClause =
    "(?:(?:" +
    RegexPathConstants.PathPrefix +
    "|(?:" +
    RegexPathConstants.ExcludedStartPathCharactersClause +
    RegexPathConstants.ExcludedPathCharactersClause +
    "*))?(?:" +
    RegexPathConstants.PathSeparatorClause +
    "(?:" +
    RegexPathConstants.ExcludedPathCharactersClause +
    ")+)+)";

/**
 * A regex clause that matches the start of an absolute path on Windows, such as: `C:`, `c:`,
 * `file:///c:` (uri) and `\\?\C:` (UNC path).
 */
export const winDrivePrefix = "(?:\\\\\\\\\\?\\\\|file:\\/\\/\\/)?[a-zA-Z]:";

/**
 * A regex that matches Windows paths, such as `\\?\c:\foo`, `c:\foo`, `~\foo`, `.\foo`, `..\foo`
 * and `foo\bar`.
 */
const winLocalLinkClause =
    "(?:(?:" +
    `(?:${winDrivePrefix}|${RegexPathConstants.WinOtherPathPrefix})` +
    "|(?:" +
    RegexPathConstants.WinExcludedStartPathCharactersClause +
    RegexPathConstants.WinExcludedPathCharactersClause +
    "*))?(?:" +
    RegexPathConstants.WinPathSeparatorClause +
    "(?:" +
    RegexPathConstants.WinExcludedPathCharactersClause +
    ")+)+)";

function detectPathsNoSuffix(line: string, os: OperatingSystem): IParsedLink[] {
    const results: IParsedLink[] = [];

    const regex = new RegExp(
        os === OperatingSystem.Windows
            ? winLocalLinkClause
            : unixLocalLinkClause,
        "g",
    );
    let match;
    while ((match = regex.exec(line)) !== null) {
        let text = match[0];
        let index = match.index;
        if (!text) {
            // Something matched but does not comply with the given match index, since this would
            // most likely a bug the regex itself we simply do nothing here
            break;
        }

        // Adjust the link range to exclude a/ and b/ if it looks like a git diff
        if (
            // --- a/foo/bar
            // +++ b/foo/bar
            ((line.startsWith("--- a/") || line.startsWith("+++ b/")) &&
                index === 4) ||
            // diff --git a/foo/bar b/foo/bar
            (line.startsWith("diff --git") &&
                (text.startsWith("a/") || text.startsWith("b/")))
        ) {
            text = text.substring(2);
            index += 2;
        }

        results.push({
            path: {
                index,
                text,
            },
            prefix: undefined,
            suffix: undefined,
        });
    }

    return results;
}

export function getXtermLineContent(
    buffer: IBuffer,
    lineStart: number,
    lineEnd: number,
    cols: number,
): string {
    // Cap the maximum number of lines generated to prevent potential performance problems. This is
    // more of a sanity check as the wrapped line should already be trimmed down at this point.
    const maxLineLength = Math.max(2048, cols * 2);
    lineEnd = Math.min(lineEnd, lineStart + maxLineLength);
    let content = "";
    for (let i = lineStart; i <= lineEnd; i++) {
        // Make sure only 0 to cols are considered as resizing when windows mode is enabled will
        // retain buffer data outside of the terminal width as reflow is disabled.
        const line = buffer.getLine(i);
        if (line) {
            content += line.translateToString(true, 0, cols);
        }
    }
    return content;
}

export function getXtermRangesByAttr(
    buffer: IBuffer,
    lineStart: number,
    lineEnd: number,
    cols: number,
): IBufferRange[] {
    let bufferRangeStart: IBufferCellPosition | undefined = undefined;
    let lastFgAttr: number = -1;
    let lastBgAttr: number = -1;
    const ranges: IBufferRange[] = [];
    for (let y = lineStart; y <= lineEnd; y++) {
        const line = buffer.getLine(y);
        if (!line) {
            continue;
        }
        for (let x = 0; x < cols; x++) {
            const cell = line.getCell(x);
            if (!cell) {
                break;
            }
            // HACK: Re-construct the attributes from fg and bg, this is hacky as it relies
            // upon the internal buffer bit layout
            const thisFgAttr =
                cell.isBold() |
                cell.isInverse() |
                cell.isStrikethrough() |
                cell.isUnderline();
            const thisBgAttr = cell.isDim() | cell.isItalic();
            if (lastFgAttr === -1 || lastBgAttr === -1) {
                bufferRangeStart = { x, y };
            } else {
                if (lastFgAttr !== thisFgAttr || lastBgAttr !== thisBgAttr) {
                    // TODO: x overflow
                    const bufferRangeEnd = { x, y };
                    ranges.push({
                        start: bufferRangeStart!,
                        end: bufferRangeEnd,
                    });
                    bufferRangeStart = { x, y };
                }
            }
            lastFgAttr = thisFgAttr;
            lastBgAttr = thisBgAttr;
        }
    }
    return ranges;
}

/**
 * A range in the editor. This interface is suitable for serialization.
 */
export interface IRange {
    /**
     * Line number on which the range starts (starts at 1).
     */
    readonly startLineNumber: number;
    /**
     * Column on which the range starts in line `startLineNumber` (starts at 1).
     */
    readonly startColumn: number;
    /**
     * Line number on which the range ends.
     */
    readonly endLineNumber: number;
    /**
     * Column on which the range ends in line `endLineNumber`.
     */
    readonly endColumn: number;
}

/**
 * Converts a possibly wrapped link's range (comprised of string indices) into a buffer range that plays nicely with xterm.js
 *
 * @param lines A single line (not the entire buffer)
 * @param bufferWidth The number of columns in the terminal
 * @param range The link range - string indices
 * @param startLine The absolute y position (on the buffer) of the line
 */
export function convertLinkRangeToBuffer(
    lines: IBufferLine[],
    bufferWidth: number,
    range: IRange,
    startLine: number,
): IBufferRange {
    const bufferRange: IBufferRange = {
        start: {
            x: range.startColumn,
            y: range.startLineNumber + startLine,
        },
        end: {
            x: range.endColumn - 1,
            y: range.endLineNumber + startLine,
        },
    };

    // Shift start range right for each wide character before the link
    let startOffset = 0;
    const startWrappedLineCount = Math.ceil(range.startColumn / bufferWidth);
    for (let y = 0; y < Math.min(startWrappedLineCount); y++) {
        const lineLength = Math.min(
            bufferWidth,
            range.startColumn - 1 - y * bufferWidth,
        );
        let lineOffset = 0;
        const line = lines[y];
        // Sanity check for line, apparently this can happen but it's not clear under what
        // circumstances this happens. Continue on, skipping the remainder of start offset if this
        // happens to minimize impact.
        if (!line) {
            break;
        }
        for (
            let x = 0;
            x < Math.min(bufferWidth, lineLength + lineOffset);
            x++
        ) {
            const cell = line.getCell(x);
            // This is unexpected but it means the character doesn't exist, so we shouldn't add to
            // the offset
            if (!cell) {
                break;
            }
            const width = cell.getWidth();
            if (width === 2) {
                lineOffset++;
            }
            const char = cell.getChars();
            if (char.length > 1) {
                lineOffset -= char.length - 1;
            }
        }
        startOffset += lineOffset;
    }

    // Shift end range right for each wide character inside the link
    let endOffset = 0;
    const endWrappedLineCount = Math.ceil(range.endColumn / bufferWidth);
    for (
        let y = Math.max(0, startWrappedLineCount - 1);
        y < endWrappedLineCount;
        y++
    ) {
        const start =
            y === startWrappedLineCount - 1
                ? (range.startColumn - 1 + startOffset) % bufferWidth
                : 0;
        const lineLength = Math.min(
            bufferWidth,
            range.endColumn + startOffset - y * bufferWidth,
        );
        let lineOffset = 0;
        const line = lines[y];
        // Sanity check for line, apparently this can happen but it's not clear under what
        // circumstances this happens. Continue on, skipping the remainder of start offset if this
        // happens to minimize impact.
        if (!line) {
            break;
        }
        for (
            let x = start;
            x < Math.min(bufferWidth, lineLength + lineOffset);
            x++
        ) {
            const cell = line.getCell(x);
            // This is unexpected but it means the character doesn't exist, so we shouldn't add to
            // the offset
            if (!cell) {
                break;
            }
            const width = cell.getWidth();
            const chars = cell.getChars();
            // Offset for null cells following wide characters
            if (width === 2) {
                lineOffset++;
            }
            // Offset for early wrapping when the last cell in row is a wide character
            if (x === bufferWidth - 1 && chars === "") {
                lineOffset++;
            }
            // Offset multi-code characters like emoji
            if (chars.length > 1) {
                lineOffset -= chars.length - 1;
            }
        }
        endOffset += lineOffset;
    }

    // Apply the width character offsets to the result
    bufferRange.start.x += startOffset;
    bufferRange.end.x += startOffset + endOffset;

    // Convert back to wrapped lines
    while (bufferRange.start.x > bufferWidth) {
        bufferRange.start.x -= bufferWidth;
        bufferRange.start.y++;
    }
    while (bufferRange.end.x > bufferWidth) {
        bufferRange.end.x -= bufferWidth;
        bufferRange.end.y++;
    }

    return bufferRange;
}

export interface ITerminalSimpleLink {
    /**
     * The text of the link.
     */
    text: string;

    uri?: URL;

    parsedLink?: IParsedLink;
    disableTrimColon?: boolean;

    /**
     * The buffer range of the link.
     */
    readonly bufferRange: IBufferRange;
}

const enum Constants {
    /**
     * The max line length to try extract word links from.
     */
    MaxLineLength = 2000,

    /**
     * The maximum number of links in a line to resolve against the file system. This limit is put
     * in place to avoid sending excessive data when remote connections are in place.
     */
    MaxResolvedLinksInLine = 10,

    /**
     * The maximum length of a link to resolve against the file system. This limit is put in place
     * to avoid sending excessive data when remote connections are in place.
     */
    MaxResolvedLinkLength = 1024,
}

const fallbackMatchers: RegExp[] = [
    // Python style error: File "<path>", line <line>
    /^ *File (?<link>"(?<path>.+)"(, line (?<line>\d+))?)/,
    // Some C++ compile error formats:
    // C:\foo\bar baz(339) : error ...
    // C:\foo\bar baz(339,12) : error ...
    // C:\foo\bar baz(339, 12) : error ...
    // C:\foo\bar baz(339): error ...       [#178584, Visual Studio CL/NVIDIA CUDA compiler]
    // C:\foo\bar baz(339,12): ...
    // C:\foo\bar baz(339, 12): ...
    /^(?<link>(?<path>.+)\((?<line>\d+)(?:, ?(?<col>\d+))?\)) ?:/,
    // C:\foo/bar baz:339 : error ...
    // C:\foo/bar baz:339:12 : error ...
    // C:\foo/bar baz:339: error ...
    // C:\foo/bar baz:339:12: error ...     [#178584, Clang]
    /^(?<link>(?<path>.+):(?<line>\d+)(?::(?<col>\d+))?) ?:/,
    // Cmd prompt
    /^(?<link>(?<path>.+))>/,
    // The whole line is the path
    /^ *(?<link>(?<path>.+))/,
];

/**
 * A link detector can search for and return links within the xterm.js buffer. A single link
 * detector can return multiple links of differing types.
 */
export interface ITerminalLinkDetector {
    /**
     * The xterm.js instance this detector belongs to.
     */
    readonly xterm: Terminal;

    /**
     * The maximum link length possible for this detector, this puts a cap on how much of a wrapped
     * line to consider to prevent performance problems.
     */
    readonly maxLinkLength: number;

    /**
     * Detects links within the _wrapped_ line range provided and returns them as an array.
     *
     * @param lines The individual buffer lines that make up the wrapped line.
     * @param startLine The start of the wrapped line. This _will not_ be validated that it is
     * indeed the start of a wrapped line.
     * @param endLine The end of the wrapped line.  This _will not_ be validated that it is indeed
     * the end of a wrapped line.
     */
    detect(
        lines: IBufferLine[],
        startLine: number,
        endLine: number,
    ): ITerminalSimpleLink[];
}

export class TerminalLocalLinkDetector implements ITerminalLinkDetector {
    static id = "local";

    // This was chosen as a reasonable maximum line length given the tradeoff between performance
    // and how likely it is to encounter such a large line length. Some useful reference points:
    // - Window old max length: 260 ($MAX_PATH)
    // - Linux max length: 4096 ($PATH_MAX)
    readonly maxLinkLength = 500;

    constructor(readonly xterm: Terminal) {}

    detect(
        lines: IBufferLine[],
        startLine: number,
        endLine: number,
    ): ITerminalSimpleLink[] {
        const links: ITerminalSimpleLink[] = [];

        // Get the text representation of the wrapped line
        const text = getXtermLineContent(
            this.xterm.buffer.active,
            startLine,
            endLine,
            this.xterm.cols,
        );
        if (text === "" || text.length > Constants.MaxLineLength) {
            return [];
        }

        let stringIndex = -1;
        let resolvedLinkCount = 0;

        const parsedLinks = detectLinks(text, OS);
        for (const parsedLink of parsedLinks) {
            // Don't try resolve any links of excessive length
            if (parsedLink.path.text.length > Constants.MaxResolvedLinkLength) {
                continue;
            }

            // Convert the link text's string index into a wrapped buffer range
            const bufferRange = convertLinkRangeToBuffer(
                lines,
                this.xterm.cols,
                {
                    startColumn:
                        (parsedLink.prefix?.index ?? parsedLink.path.index) + 1,
                    startLineNumber: 1,
                    endColumn:
                        parsedLink.path.index +
                        parsedLink.path.text.length +
                        (parsedLink.suffix?.suffix.text.length ?? 0) +
                        1,
                    endLineNumber: 1,
                },
                startLine,
            );

            // Get a single link candidate if the cwd of the line is known
            const linkCandidates: string[] = [parsedLink.path.text];
            if (parsedLink.path.text.match(/^(\.\.[\/\\])+/)) {
                linkCandidates.push(
                    parsedLink.path.text.replace(/^(\.\.[\/\\])+/, ""),
                );
            }

            // If any candidates end with special characters that are likely to not be part of the
            // link, add a candidate excluding them.
            const specialEndCharRegex = /[\[\]"'\.]$/;
            const trimRangeMap: Map<string, number> = new Map();
            const specialEndLinkCandidates: string[] = [];
            for (const candidate of linkCandidates) {
                let previous = candidate;
                let removed = previous.replace(specialEndCharRegex, "");
                let trimRange = 0;
                while (removed !== previous) {
                    // Only trim the link if there is no suffix, otherwise the underline would be incorrect
                    if (!parsedLink.suffix) {
                        trimRange++;
                    }
                    specialEndLinkCandidates.push(removed);
                    trimRangeMap.set(removed, trimRange);
                    previous = removed;
                    removed = removed.replace(specialEndCharRegex, "");
                }
            }
            linkCandidates.push(...specialEndLinkCandidates);

            // Validate the path and convert to the outgoing type
            const simpleLink = this._validateAndGetLink(
                undefined,
                bufferRange,
                linkCandidates,
                trimRangeMap,
            );
            if (simpleLink) {
                simpleLink.parsedLink = parsedLink;
                simpleLink.text = text.substring(
                    parsedLink.prefix?.index ?? parsedLink.path.index,
                    parsedLink.suffix
                        ? parsedLink.suffix.suffix.index +
                              parsedLink.suffix.suffix.text.length
                        : parsedLink.path.index + parsedLink.path.text.length,
                );
                links.push(simpleLink);
            }

            // Stop early if too many links exist in the line
            if (++resolvedLinkCount >= Constants.MaxResolvedLinksInLine) {
                break;
            }
        }

        // Match against the fallback matchers which are mainly designed to catch paths with spaces
        // that aren't possible using the regular mechanism.
        if (links.length === 0) {
            for (const matcher of fallbackMatchers) {
                const match = text.match(matcher);
                const group = match?.groups;
                if (!group) {
                    continue;
                }
                const link = group?.link;
                const path = group?.path;
                const line = group?.line;
                const col = group?.col;
                if (!link || !path) {
                    continue;
                }

                // Don't try resolve any links of excessive length
                if (link.length > Constants.MaxResolvedLinkLength) {
                    continue;
                }

                // Convert the link text's string index into a wrapped buffer range
                stringIndex = text.indexOf(link);
                const bufferRange = convertLinkRangeToBuffer(
                    lines,
                    this.xterm.cols,
                    {
                        startColumn: stringIndex + 1,
                        startLineNumber: 1,
                        endColumn: stringIndex + link.length + 1,
                        endLineNumber: 1,
                    },
                    startLine,
                );

                // Validate and add link
                const suffix = line ? `:${line}${col ? `:${col}` : ""}` : "";
                const simpleLink = this._validateAndGetLink(
                    `${path}${suffix}`,
                    bufferRange,
                    [path],
                );
                if (simpleLink) {
                    links.push(simpleLink);
                }

                // Only match a single fallback matcher
                break;
            }
        }

        // Sometimes links are styled specially in the terminal like underlined or bolded, try split
        // the line by attributes and test whether it matches a path
        if (links.length === 0) {
            const rangeCandidates = getXtermRangesByAttr(
                this.xterm.buffer.active,
                startLine,
                endLine,
                this.xterm.cols,
            );
            for (const rangeCandidate of rangeCandidates) {
                let text = "";
                for (
                    let y = rangeCandidate.start.y;
                    y <= rangeCandidate.end.y;
                    y++
                ) {
                    const line = this.xterm.buffer.active.getLine(y);
                    if (!line) {
                        break;
                    }
                    const lineStartX =
                        y === rangeCandidate.start.y
                            ? rangeCandidate.start.x
                            : 0;
                    const lineEndX =
                        y === rangeCandidate.end.y
                            ? rangeCandidate.end.x
                            : this.xterm.cols - 1;
                    text += line.translateToString(false, lineStartX, lineEndX);
                }

                // HACK: Adjust to 1-based for link API
                rangeCandidate.start.x++;
                rangeCandidate.start.y++;
                rangeCandidate.end.y++;

                // Validate and add link
                const simpleLink = this._validateAndGetLink(
                    text,
                    rangeCandidate,
                    [text],
                );
                if (simpleLink) {
                    links.push(simpleLink);
                }

                // Stop early if too many links exist in the line
                if (++resolvedLinkCount >= Constants.MaxResolvedLinksInLine) {
                    break;
                }
            }
        }

        return links;
    }

    private _validateLinkCandidates(linkCandidates: string[]): URL | undefined {
        for (const link of linkCandidates) {
            if (!/^(\.|\.\.|[A-Z]\:|\\|\/)/.test(link)) {
                continue;
            }
            let uri: URL | undefined;
            if (link.startsWith("file://")) {
                try {
                    uri = new URL(link);
                } catch {}
            } else {
                try {
                    uri = new URL(`file://${link}`);
                } catch {}
            }
            if (uri) {
                return uri;
            }
        }
        return undefined;
    }

    /**
     * Validates a set of link candidates and returns a link if validated.
     * @param linkText The link text, this should be undefined to use the link stat value
     * @param trimRangeMap A map of link candidates to the amount of buffer range they need trimmed.
     */
    private _validateAndGetLink(
        linkText: string | undefined,
        bufferRange: IBufferRange,
        linkCandidates: string[],
        trimRangeMap?: Map<string, number>,
    ): ITerminalSimpleLink | undefined {
        const linkStat = this._validateLinkCandidates(linkCandidates);
        if (linkStat) {
            // Offset the buffer range if the link range was trimmed
            const trimRange = trimRangeMap?.get(linkStat.href);
            if (trimRange) {
                bufferRange.end.x -= trimRange;
                if (bufferRange.end.x < 0) {
                    bufferRange.end.y--;
                    bufferRange.end.x += this.xterm.cols;
                }
            }

            return {
                text: linkText ?? linkStat.href,
                uri: linkStat,
                bufferRange: bufferRange,
            };
        }
        return undefined;
    }
}
