import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

// @ts-ignore
import HonestEditor from 'honest-editor-js';
import { Post } from '@app/shared/interfaces';
import { PostService } from '@app/shared/services/post.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { PostPublishModalComponent } from '@app/shared/components/modals/post-publish-modal/post-publish-modal.component';

@Injectable()
export class EditorService {
  public loaded = new BehaviorSubject('none');
  public isLoaded = this.loaded.asObservable();

  private editor: any;
  private post: Post;

  constructor(private postService: PostService, private toastr: ToastrService, private modalService: NgbModal) {}

  setEditor(domId: string = 'honest-editor') {
    this.editor = new HonestEditor(domId);

    this.editor.subscribe((markdown: string) => {
      this.loaded.next('bodyChanged');
      this.post.bodyMD = markdown;
    });

    this.loaded.next('editor');
  }

  getEditor() {
    return this.editor;
  }

  setPost(post: Post) {
    this.post = post;
    this.editor.setContent(post.bodyMD);
    this.loaded.next('post');
  }

  getPost(): Post {
    return this.post;
  }

  saveDraft() {
    this.postService
      .saveDraft(this.post)
      .toPromise()
      .then(d => {
        this.loaded.next('draftSaved');
      });
  }

  publishPost() {
    if (this.post.bodyMD.length < 50) {
      return this.toastr.error('The story needs to be at least 50 characters.');
    } else {
      const modalRef = this.modalService.open(PostPublishModalComponent, {
        backdrop: 'static'
      });

      modalRef.result.then(
        hashtags => {
          this.post.hashtags = hashtags;

          this.postService
            .publishPost(this.post)
            .toPromise()
            .then(d => {
              this.toastr.success('Post has been published.');
              this.loaded.next('postPublished');
            });
        },
        e => console.log('error', e)
      );
    }
  }
}