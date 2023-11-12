import { SendArticleCommentDto } from './send-article-comment.dto';

export class SendArticleCommentReplyDto extends SendArticleCommentDto {
  belongCommentId: string;
  replyToCommentId: string;
  isReplyToTop: number;
}
