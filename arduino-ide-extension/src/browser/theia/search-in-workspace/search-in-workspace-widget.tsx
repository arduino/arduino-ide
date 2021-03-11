import { injectable } from 'inversify';
import * as React from 'react';
import { Key, KeyCode } from '@theia/core/lib/browser';
import { SearchInWorkspaceWidget as TheiaSearchInWorkspaceWidget } from '@theia/search-in-workspace/lib/browser/search-in-workspace-widget';

/**
 * Workaround for https://github.com/eclipse-theia/theia/pull/9183.
 */
@injectable()
export class SearchInWorkspaceWidget extends TheiaSearchInWorkspaceWidget {

    protected renderGlobField(kind: 'include' | 'exclude'): React.ReactNode {
        const currentValue = this.searchInWorkspaceOptions[kind];
        const value = currentValue && currentValue.join(', ') || '';
        return <div className='glob-field'>
            <div className='label'>{'files to ' + kind}</div>
            <input
                className='theia-input'
                type='text'
                size={1}
                defaultValue={value}
                id={kind + '-glob-field'}
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
                            this.resultTreeWidget.search(this.searchTerm, this.searchInWorkspaceOptions);
                        }
                    }
                }}
                onFocus={kind === 'include' ? this.handleFocusIncludesInputBox : this.handleFocusExcludesInputBox}
                onBlur={kind === 'include' ? this.handleBlurIncludesInputBox : this.handleBlurExcludesInputBox}></input>
        </div>;
    }

}
