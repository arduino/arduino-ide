import { MaybePromise } from '@theia/core';
import { Dialog, DialogError } from '@theia/core/lib/browser/dialogs';
import { LabelProvider } from '@theia/core/lib/browser/label-provider';
import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import type {
  Progress,
  ProgressUpdate,
} from '@theia/core/lib/common/message-service-protocol';
import { Widget } from '@theia/core/shared/@phosphor/widgets';
import { inject } from '@theia/core/shared/inversify';
import {
  WorkspaceInputDialog as TheiaWorkspaceInputDialog,
  WorkspaceInputDialogProps,
} from '@theia/workspace/lib/browser/workspace-input-dialog';
import { v4 } from 'uuid';

export class WorkspaceInputDialog extends TheiaWorkspaceInputDialog {
  private skipShowErrorMessageOnOpen: boolean;

  constructor(
    @inject(WorkspaceInputDialogProps)
    protected override readonly props: WorkspaceInputDialogProps,
    @inject(LabelProvider)
    protected override readonly labelProvider: LabelProvider
  ) {
    super(props, labelProvider);
    if (this.contentNode.contains(this.errorMessageNode)) {
      // Reverts https://github.com/eclipse-theia/theia/pull/12585/files#diff-068570364d86f936ca72dfc52f8bfa93f14f6d971e2e6fa19216f33cb322244bR533-R534
      this.contentNode.removeChild(this.errorMessageNode);
      this.controlPanel.prepend(this.errorMessageNode);
    }
    this.node.classList.add('workspace-input-dialog');
    this.appendCloseButton(Dialog.CANCEL);
  }

  protected override appendParentPath(): void {
    // NOOP
  }

  override isValid(value: string): MaybePromise<DialogError> {
    return super.isValid(value, 'open');
  }

  override open(
    skipShowErrorMessageOnOpen = false
  ): Promise<string | undefined> {
    this.skipShowErrorMessageOnOpen = skipShowErrorMessageOnOpen;
    return super.open();
  }

  protected override setErrorMessage(error: DialogError): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = !DialogError.getResult(error);
    }
    if (this.skipShowErrorMessageOnOpen) {
      this.skipShowErrorMessageOnOpen = false;
    } else {
      this.errorMessageNode.innerText = DialogError.getMessage(error);
    }
  }

  protected override appendCloseButton(text: string): HTMLButtonElement {
    this.closeButton = this.createButton(text);
    this.controlPanel.insertBefore(
      this.closeButton,
      this.controlPanel.lastChild
    );
    this.closeButton.classList.add('secondary');
    return this.closeButton;
  }
}

interface TaskFactory<T> {
  createTask(value: string): (progress: Progress) => Promise<T>;
}

export class TaskFactoryImpl<T> implements TaskFactory<T> {
  private _value: string | undefined;

  constructor(private readonly task: TaskFactory<T>['createTask']) {}

  get value(): string | undefined {
    return this._value;
  }

  createTask(value: string): (progress: Progress) => Promise<T> {
    this._value = value;
    return this.task(this._value);
  }
}

/**
 * Workspace input dialog executing a long running operation with indefinite progress.
 */
export class WorkspaceInputDialogWithProgress<
  T = unknown
> extends WorkspaceInputDialog {
  private _taskResult: T | undefined;

  constructor(
    protected override readonly props: WorkspaceInputDialogProps,
    protected override readonly labelProvider: LabelProvider,
    /**
     * The created task will provide the result. See `#taskResult`.
     */
    private readonly taskFactory: TaskFactory<T>
  ) {
    super(props, labelProvider);
  }

  get taskResult(): T | undefined {
    return this._taskResult;
  }

  protected override async accept(): Promise<void> {
    if (!this.resolve) {
      return;
    }
    this.acceptCancellationSource.cancel();
    this.acceptCancellationSource = new CancellationTokenSource();
    const token = this.acceptCancellationSource.token;
    const value = this.value;
    const error = await this.isValid(value);
    if (token.isCancellationRequested) {
      return;
    }
    if (!DialogError.getResult(error)) {
      this.setErrorMessage(error);
    } else {
      const spinner = document.createElement('div');
      spinner.classList.add('spinner');
      const disposables = new DisposableCollection();
      try {
        this.toggleButtons(true);
        disposables.push(Disposable.create(() => this.toggleButtons(false)));

        const closeParent = this.closeCrossNode.parentNode;
        closeParent?.removeChild(this.closeCrossNode);
        disposables.push(
          Disposable.create(() => {
            closeParent?.appendChild(this.closeCrossNode);
          })
        );

        this.errorMessageNode.classList.add('progress');
        disposables.push(
          Disposable.create(() =>
            this.errorMessageNode.classList.remove('progress')
          )
        );

        const errorParent = this.errorMessageNode.parentNode;
        errorParent?.insertBefore(spinner, this.errorMessageNode);
        disposables.push(
          Disposable.create(() => errorParent?.removeChild(spinner))
        );

        const cancellationSource = new CancellationTokenSource();
        const progress: Progress = {
          id: v4(),
          cancel: () => cancellationSource.cancel(),
          report: (update: ProgressUpdate) => {
            this.setProgressMessage(update);
          },
          result: Promise.resolve(value),
        };
        const task = this.taskFactory.createTask(value);
        this._taskResult = await task(progress);
        this.resolve(value);
      } catch (err) {
        if (this.reject) {
          this.reject(err);
        } else {
          throw err;
        }
      } finally {
        Widget.detach(this);
        disposables.dispose();
      }
    }
  }

  private toggleButtons(disabled: boolean): void {
    if (this.acceptButton) {
      this.acceptButton.disabled = disabled;
    }
    if (this.closeButton) {
      this.closeButton.disabled = disabled;
    }
  }

  private setProgressMessage(update: ProgressUpdate): void {
    if (update.work && update.work.done === update.work.total) {
      this.errorMessageNode.innerText = '';
    } else {
      if (update.message) {
        this.errorMessageNode.innerText = update.message;
      }
    }
  }
}
