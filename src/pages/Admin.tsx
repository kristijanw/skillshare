import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Flag, Ban, Trash2, RotateCcw, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Tab = "users" | "reports" | "blocks";

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    const [{ data: usersData }, { data: reportsData }, { data: blocksData }] = await Promise.all([
      supabase.from("profiles").select("*").order("name"),
      supabase.from("reports").select("*, reporter:profiles!reports_reporter_id_fkey(name), reported:profiles!reports_reported_user_id_fkey(name)").order("created_at", { ascending: false }),
      supabase.from("blocks").select("*, blocker:profiles!blocks_blocker_id_fkey(name), blocked:profiles!blocks_blocked_id_fkey(name)").order("created_at", { ascending: false }),
    ]);

    setUsers(usersData ?? []);
    setReports(reportsData ?? []);
    setBlocks(blocksData ?? []);
    setLoading(false);
  };

  const callAdminAction = async (action: string, targetUserId: string, label: string) => {
    setActionLoading(targetUserId + action);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke("admin-action", {
        body: { action, targetUserId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      toast({ title: label });
      await fetchAll();
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "users", label: "Korisnici", icon: <Users className="h-4 w-4" /> },
    { key: "reports", label: "Prijave", icon: <Flag className="h-4 w-4" /> },
    { key: "blocks", label: "Blokiranja", icon: <Ban className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <header className="shrink-0 border-b border-border px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/profile")} className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold font-display">Admin panel</h1>
          </div>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
            >
              {t.icon} {t.label}
              {t.key === "reports" && reports.length > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">{reports.length}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* USERS */}
            {tab === "users" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{users.length} korisnika ukupno</p>
                {users.map((u, i) => (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card"
                  >
                    <img
                      src={u.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{u.name ?? "—"}</span>
                        {u.is_admin && <Badge className="text-[10px] px-1.5 py-0 bg-primary">Admin</Badge>}
                        {u.is_suspended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspendiran</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.city ?? "—"}{u.age ? `, ${u.age}g` : ""}</p>
                    </div>
                    {!u.is_admin && (
                      <div className="flex gap-1 shrink-0">
                        {u.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            disabled={actionLoading === u.user_id + "unsuspend"}
                            onClick={() => callAdminAction("unsuspend", u.user_id, `${u.name} reaktiviran`)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Reaktiviraj
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-amber-600 border-amber-200">
                                <Ban className="h-3 w-3 mr-1" /> Suspendiraj
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Suspendiraj korisnika?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Korisnik {u.name} bit će suspendiran i odjavljan. Dobit će email obavijest.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction onClick={() => callAdminAction("suspend", u.user_id, `${u.name} suspendiran`)}>
                                  Suspendiraj
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs text-destructive border-destructive/20">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Obriši račun?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Račun korisnika {u.name} bit će trajno obrisan. Korisnik će dobiti email obavijest.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Odustani</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => callAdminAction("delete", u.user_id, `${u.name} obrisan`)}
                              >
                                Obriši
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* REPORTS */}
            {tab === "reports" && (
              <div className="space-y-2">
                {reports.length === 0 ? (
                  <p className="py-20 text-center text-muted-foreground">Nema prijava</p>
                ) : reports.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl bg-card p-4 shadow-card space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{r.reporter?.name ?? "—"}</span>
                        <span className="text-muted-foreground"> prijavio/la </span>
                        <span className="font-medium">{r.reported?.name ?? "—"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("hr-HR")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">{r.reason}</p>
                    {r.reported_user_id && (
                      <div className="flex gap-2 pt-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-amber-600 border-amber-200">
                              <Ban className="h-3 w-3 mr-1" /> Suspendiraj
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Suspendiraj korisnika?</AlertDialogTitle>
                              <AlertDialogDescription>Korisnik {r.reported?.name} bit će suspendiran i dobiti email obavijest.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Odustani</AlertDialogCancel>
                              <AlertDialogAction onClick={() => callAdminAction("suspend", r.reported_user_id, `${r.reported?.name} suspendiran`)}>
                                Suspendiraj
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive border-destructive/20">
                              <Trash2 className="h-3 w-3 mr-1" /> Obriši račun
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Obriši račun?</AlertDialogTitle>
                              <AlertDialogDescription>Račun korisnika {r.reported?.name} bit će trajno obrisan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Odustani</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => callAdminAction("delete", r.reported_user_id, `${r.reported?.name} obrisan`)}>
                                Obriši
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* BLOCKS */}
            {tab === "blocks" && (
              <div className="space-y-2">
                {blocks.length === 0 ? (
                  <p className="py-20 text-center text-muted-foreground">Nema blokiranja</p>
                ) : blocks.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-card p-4 shadow-card"
                  >
                    <div className="text-sm">
                      <span className="font-medium">{b.blocker?.name ?? "—"}</span>
                      <span className="text-muted-foreground"> blokirao/la </span>
                      <span className="font-medium">{b.blocked?.name ?? "—"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("hr-HR")}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
