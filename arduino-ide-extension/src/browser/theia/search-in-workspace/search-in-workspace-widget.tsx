/* eslint-disable prettier/prettier */
import { codicon, Key, KeyCode, Message } from '@theia/core/lib/browser';
import { CommandService } from '@theia/core/lib/common/command';
import { inject } from '@theia/core/shared/inversify';
import { SearchInWorkspaceWidget } from '@theia/search-in-workspace/lib/browser/search-in-workspace-widget';
import { SearchInWorkspaceInput } from '@theia/search-in-workspace/lib/browser/components/search-in-workspace-input';
import React from 'react';

export class MySearchInWorkspaceWidget extends SearchInWorkspaceWidget {
    private replaceRef1 = React.createRef<SearchInWorkspaceInput>();
    private includeRef1 = React.createRef<SearchInWorkspaceInput>();
    private excludeRef1 = React.createRef<SearchInWorkspaceInput>();

    @inject(CommandService) private commandService: CommandService;

    protected override init(): void {
        SearchInWorkspaceWidget.LABEL = "搜索"
        const span = document.createElement('span');
        span.innerText = '代码搜索';
        span.style.display = 'flex';
        span.style.color = '#000000';
        span.style.marginLeft = '9px';
        span.style.marginTop = '-2px';
        this.node.appendChild(span);
        super.init();
        this.matchCaseState = {
            className: codicon('case-sensitive'),
            enabled: false,
            title: '匹配大小写'
        };
        this.wholeWordState = {
            className: codicon('whole-word'),
            enabled: false,
            title: '全字匹配'
        };
        this.regExpState = {
            className: codicon('regex'),
            enabled: false,
            title: '使用正则表达式'
        };
        this.includeIgnoredState = {
            className: codicon('eye'),
            enabled: false,
            title: '包括被忽略的文件'
        };
    }

    protected override renderExpandGlobFieldsButton(): React.ReactNode {
        return <div className='button-container'>
            <span
                title={'切换搜索详情信息'}
                className={codicon('ellipsis')}
                onClick={() => {
                    this.showSearchDetails = !this.showSearchDetails;
                    this.update();
                }}></span>
        </div>;
    }

    protected override renderReplaceAllButtonContainer(): React.ReactNode {
        // The `Replace All` button is enabled if there is a search term present with results.
        const enabled: boolean = this.searchTerm !== '' && this.resultNumber > 0;
        return <div className='replace-all-button-container'>
            <span
                title={'全部替换'}
                className={`${codicon('replace-all', true)} ${enabled ? ' ' : ' disabled'}`}
                onClick={() => {
                    if (enabled) {
                        this.resultTreeWidget.replace(undefined);
                    }
                }}>
            </span>
        </div>;
    }

    protected override renderReplaceField(): React.ReactNode {
        const replaceAllButtonContainer = this.renderReplaceAllButtonContainer();
        const replace = '替换';
        return <div className={`replace-field${this.showReplaceField ? '' : ' hidden'}`}>
            <SearchInWorkspaceInput
                id='replace-input-field'
                className='theia-input'
                title={replace}
                type='text'
                size={1}
                placeholder={replace}
                defaultValue={this.replaceTerm}
                autoComplete='off'
                onKeyUp={this.updateReplaceTerm}
                onFocus={this.handleFocusReplaceInputBox}
                onBlur={this.handleBlurReplaceInputBox}
                ref={this.replaceRef1}
            />
            {replaceAllButtonContainer}
        </div>;
    }

    protected override renderGlobField(kind: 'include' | 'exclude'): React.ReactNode {
        const currentValue = this.searchInWorkspaceOptions[kind];
        const value = currentValue && currentValue.join(', ') || '';
        return <div className='glob-field'>
            <div className='label'>{kind === 'include' ? '包含的文件' : '排除的文件'}</div>
            <SearchInWorkspaceInput
                className='theia-input'
                type='text'
                size={1}
                defaultValue={value}
                autoComplete='off'
                id={kind + '-glob-field'}
                placeholder={kind === 'include'
                    ? '例如 *.ts, src/**/include'
                    : '例如 *.ts, src/**/exclude'
                }
                onKeyUp={e => {
                    if (e.target) {
                        const targetValue = (e.target as HTMLInputElement).value || '';
                        let shouldSearch = Key.ENTER.keyCode === KeyCode.createKeyCode(e.nativeEvent).key?.keyCode;
                        const currentOptions = (this.searchInWorkspaceOptions[kind] || []).slice().map(s => s.trim()).sort();
                        const candidateOptions = this.splitOnComma(targetValue).map(s => s.trim()).sort();
                        const sameAs = (left: string[], right: string[]) => {
                            if (left.length !== right.length) {
                                return false;
                            }
                            for (let i = 0; i < left.length; i++) {
                                if (left[i] !== right[i]) {
                                    return false;
                                }
                            }
                            return true;
                        };
                        if (!sameAs(currentOptions, candidateOptions)) {
                            this.searchInWorkspaceOptions[kind] = this.splitOnComma(targetValue);
                            shouldSearch = true;
                        }
                        if (shouldSearch) {
                            this.performSearch();
                        }
                    }
                }}
                onFocus={kind === 'include' ? this.handleFocusIncludesInputBox : this.handleFocusExcludesInputBox}
                onBlur={kind === 'include' ? this.handleBlurIncludesInputBox : this.handleBlurExcludesInputBox}
                ref={kind === 'include' ? this.includeRef1 : this.excludeRef1}
            />
        </div>;
    }

    protected override getSearchResultMessage(): string | undefined {

        if (!this.searchTerm) {
            return undefined;
        }

        if (this.resultNumber === 0) {
            const isIncludesPresent = this.searchInWorkspaceOptions.include && this.searchInWorkspaceOptions.include.length > 0;
            const isExcludesPresent = this.searchInWorkspaceOptions.exclude && this.searchInWorkspaceOptions.exclude.length > 0;

            let message: string;
            if (isIncludesPresent && isExcludesPresent) {
                message = `在"${this.searchInWorkspaceOptions.include!.toString()}"中找不到结果("${this.searchInWorkspaceOptions.exclude!.toString()}"除外) - `;
            } else if (isIncludesPresent) {
                message = `在"${this.searchInWorkspaceOptions.include!.toString()}"未找到任何结果 - `;
            } else if (isExcludesPresent) {
                message = `除"${this.searchInWorkspaceOptions.exclude!.toString()}"之外,未找到任何结果 - `;
            } else {
                message = '未找到结果 - ';
            }
            // We have to trim here as vscode will always add a trailing " - " string
            return message.substring(0, message.length - 2).trim();
        } else {
            if (this.resultNumber === 1 && this.resultTreeWidget.fileNumber === 1) {
                return `${this.resultTreeWidget.fileNumber.toString()} 文件中有 ${this.resultNumber.toString()} 个结果`;
            } else if (this.resultTreeWidget.fileNumber === 1) {
                return `${this.resultTreeWidget.fileNumber.toString()} 文件中有 ${this.resultNumber.toString()} 个结果`;
            } else if (this.resultTreeWidget.fileNumber > 0) {
                return `${this.resultTreeWidget.fileNumber.toString()} 文件中有 ${this.resultNumber.toString()} 个结果`;
            } else {
                // if fileNumber === 0, return undefined so that `onUpdateRequest()` would not re-render component
                return undefined;
            }
        }
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.commandService.executeCommand('openMainAndRight:command');
        let a = document.getElementById('replace-input-field') as HTMLInputElement;
        a.placeholder = '搜索代码';
    }
}
