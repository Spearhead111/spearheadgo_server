export class LikeArticleCommentDto {
  articleId: number;
  commentId: number;
  /** 0-文章评论, 1-评论回复 */
  type: number;
}
