import { useState, useEffect } from "react";
import { gamesApi } from "@/api/games.api";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GameReviewsDialog({
  gameId,
  gameName,
  open,
  onOpenChange,
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load reviews when dialog opens
  useEffect(() => {
    if (open && gameId) {
      loadReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameId, user]);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gamesApi.getReviews(gameId);
      setReviews(data.reviews || []);
      setStats(data.stats || null);

      // Load my review if logged in
      if (user) {
        try {
          const myData = await gamesApi.getMyReview(gameId);
          setMyReview(myData.review);
          if (myData.review) {
            setRating(myData.review.rating);
            setComment(myData.review.comment || "");
          }
        } catch {
          // No review or not logged in
          setMyReview(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      setError("Vui lòng chọn số sao");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (myReview) {
        // Update existing review
        await gamesApi.updateReview(gameId, { rating, comment });
      } else {
        // Create new review
        await gamesApi.createReview(gameId, { rating, comment });
      }

      setIsEditing(false);
      await loadReviews(); // Reload to show updated review
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    setSubmitting(true);
    setError(null);

    try {
      await gamesApi.deleteReview(gameId);
      setMyReview(null);
      setRating(0);
      setComment("");
      setIsEditing(false);
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value, interactive = false, size = "w-6 h-6") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${
              interactive ? "cursor-pointer" : "cursor-default"
            } transition-colors`}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? hoverRating || rating : value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Đánh giá: {gameName}</DialogTitle>
          <DialogDescription>
            Xem đánh giá từ người chơi khác và chia sẻ trải nghiệm của bạn
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : (
          <div className="space-y-6">
            {/* Stats Summary */}
            {stats && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {stats.average_rating || "N/A"}
                      </div>
                      <div className="text-sm text-gray-600">/ 5.0</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {renderStars(
                          parseFloat(stats.average_rating) || 0,
                          false,
                        )}
                        <span className="text-sm text-gray-600">
                          ({stats.total_reviews} đánh giá)
                        </span>
                      </div>
                      {/* Rating distribution */}
                      {stats.rating_distribution && (
                        <div className="space-y-1 mt-2">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.rating_distribution[star] || 0;
                            const percent =
                              stats.total_reviews > 0
                                ? (count / stats.total_reviews) * 100
                                : 0;
                            return (
                              <div
                                key={star}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="w-8">{star}⭐</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* My Review Section */}
            {user && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">
                    {myReview && !isEditing
                      ? "Đánh giá của bạn"
                      : "Viết đánh giá"}
                  </h3>

                  {myReview && !isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {renderStars(myReview.rating, false)}
                      </div>
                      {myReview.comment && (
                        <p className="text-gray-700">{myReview.comment}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteReview}
                          disabled={submitting}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Đánh giá của bạn *
                        </label>
                        {renderStars(rating, true, "w-8 h-8")}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nhận xét (tùy chọn)
                        </label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Chia sẻ trải nghiệm của bạn về game này..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={submitting || !rating}
                        >
                          {submitting
                            ? "Đang gửi..."
                            : myReview
                              ? "Cập nhật"
                              : "Gửi đánh giá"}
                        </Button>
                        {myReview && isEditing && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setRating(myReview.rating);
                              setComment(myReview.comment || "");
                            }}
                          >
                            Hủy
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* All Reviews */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Tất cả đánh giá ({reviews.length})
              </h3>

              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={review.avatar_url} />
                          <AvatarFallback>
                            {(review.display_name ||
                              review.username ||
                              "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">
                              {review.display_name || review.username}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                          <div className="mb-2">
                            {renderStars(review.rating, false, "w-4 h-4")}
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
