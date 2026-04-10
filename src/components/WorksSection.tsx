import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Play, X, Upload, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Work {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  video_url: string | null;
}

interface WorksSectionProps {
  userId: string;
  works: Work[];
  editable?: boolean;
  onWorksChange?: (works: Work[]) => void;
}

const WorksSection = ({ userId, works, editable = false, onWorksChange }: WorksSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) {
      toast({ title: "Slika prevelika", description: "Maksimalno 10MB po slici", variant: "destructive" });
      e.target.value = "";
      return;
    }

    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video prevelik", description: "Maksimalno 100MB", variant: "destructive" });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = objectUrl;
    vid.onloadedmetadata = () => {
      if (vid.duration > 60) {
        toast({ title: "Video predug", description: "Maksimalno 1 minuta", variant: "destructive" });
        e.target.value = "";
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setVideoFile(file);
      setVideoPreview(objectUrl);
      e.target.value = "";
    };
  };

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setDescription("");
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleAdd = async () => {
    if (!title.trim() || imageFiles.length === 0) return;
    if (works.length >= 5) {
      toast({ title: "Maksimalno 5 radova", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from("works").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("works").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }

      // Upload video
      let video_url: string | null = null;
      if (videoFile) {
        const vidExt = videoFile.name.split(".").pop();
        const vidPath = `${userId}/videos/${Date.now()}.${vidExt}`;
        const { error } = await supabase.storage.from("works").upload(vidPath, videoFile);
        if (error) throw error;
        const { data } = supabase.storage.from("works").getPublicUrl(vidPath);
        video_url = data.publicUrl;
      }

      // Insert work (first image as thumbnail)
      const { data: workData, error: workError } = await supabase.from("works").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        image_url: uploadedUrls[0],
        video_url,
      }).select().single();
      if (workError) throw workError;

      // Insert all images into work_images
      if (uploadedUrls.length > 0) {
        await supabase.from("work_images").insert(
          uploadedUrls.map((url, i) => ({ work_id: workData.id, image_url: url, position: i }))
        );
      }

      onWorksChange?.([...works, workData as Work]);
      resetForm();
      toast({ title: "Rad dodan! ✅" });
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (work: Work) => {
    try {
      await supabase.from("works").delete().eq("id", work.id);
      onWorksChange?.(works.filter((w) => w.id !== work.id));
      toast({ title: "Rad obrisan" });
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    }
  };

  if (works.length === 0 && !editable) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground font-display">Moji radovi</h3>
        {editable && works.length < 5 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Dodaj rad
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Naziv rada"
            className="rounded-xl"
            maxLength={80}
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opis (opcionalno)"
            className="rounded-xl min-h-[80px]"
            maxLength={300}
          />

          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden">
                  <img src={src} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          {imageFiles.length < 5 && (
            <button
              onClick={() => imageRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Images className="h-4 w-4" />
              {imageFiles.length === 0 ? "Dodaj slike (obavezno, max 5)" : `Dodaj još slika (${imageFiles.length}/5)`}
            </button>
          )}

          <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
          {videoPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              <video src={videoPreview} className="w-full max-h-40 rounded-xl object-cover" controls />
              <button
                onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => videoRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <Play className="h-4 w-4" />
              Dodaj video (opcionalno, max 1 min)
            </button>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm} className="flex-1 rounded-xl">
              Odustani
            </Button>
            <Button
              onClick={handleAdd}
              disabled={uploading || !title.trim() || imageFiles.length === 0}
              className="flex-1 rounded-xl gradient-warm text-primary-foreground border-0"
            >
              {uploading ? "Spremam..." : "Spremi"}
            </Button>
          </div>
        </div>
      )}

      {/* Works grid */}
      {works.length === 0 ? (
        <p className="text-sm text-muted-foreground">Još nema radova. Dodaj prvi!</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {works.map((work) => (
            <div
              key={work.id}
              className="relative overflow-hidden rounded-xl bg-secondary cursor-pointer"
              onClick={() => navigate(`/work/${work.id}`)}
            >
              <img src={work.image_url} alt={work.title} className="h-36 w-full object-cover" />
              {work.video_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-4">
                <p className="text-xs font-medium text-white truncate">{work.title}</p>
              </div>
              {editable && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(work); }}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorksSection;
