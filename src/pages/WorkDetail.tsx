import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Work {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  video_url: string | null;
}

interface WorkImage {
  id: string;
  image_url: string;
  position: number;
}

const WorkDetail = () => {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null>(null);
  const [images, setImages] = useState<WorkImage[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!workId) return;
    const fetchWork = async () => {
      const [{ data: workData }, { data: imagesData }] = await Promise.all([
        supabase.from("works").select("*").eq("id", workId).single(),
        supabase.from("work_images").select("*").eq("work_id", workId).order("position"),
      ]);
      if (!workData) { navigate(-1); return; }
      setWork(workData as Work);
      setImages(imagesData ?? []);
      setLoading(false);
    };
    fetchWork();
  }, [workId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!work) return null;

  const allImages = images.length > 0 ? images : [{ id: "main", image_url: work.image_url, position: 0 }];

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Image viewer */}
      <div
        className="relative w-full bg-black shrink-0"
        style={{ height: "75vw", maxHeight: "460px" }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            if (diff > 0 && currentImage < allImages.length - 1) setCurrentImage((p) => p + 1);
            if (diff < 0 && currentImage > 0) setCurrentImage((p) => p - 1);
          }
          touchStartX.current = null;
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={allImages[currentImage]?.image_url}
            alt={work.title}
            className="h-full w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-5 py-5 space-y-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">{work.title}</h1>
            {work.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{work.description}</p>
            )}
          </div>

          {/* Image thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary" : "border-transparent"}`}
                >
                  <img src={img.image_url} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Video */}
          {work.video_url && (
            <div className="rounded-xl overflow-hidden bg-black">
              {showVideo ? (
                <video
                  src={work.video_url}
                  controls
                  autoPlay
                  className="w-full max-h-64"
                />
              ) : (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex w-full items-center justify-center gap-3 py-5 text-white"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Play className="h-6 w-6 fill-white" />
                  </div>
                  <span className="text-sm font-medium">Reproduciraj video</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkDetail;
