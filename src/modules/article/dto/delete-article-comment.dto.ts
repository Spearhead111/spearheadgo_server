export class DeleteArticleCommentDto {
  articleId: string;
  commentId: string;
  /** 0-文章评论, 1-评论回复 */
  type: number;
}
