"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@mui/lab";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

type PatchItem = { id: number; createdAt: string; patchText: string };
type FileDiffsResponse = {
  data: {
    filePath: string;
    student: string;
    finalText: string;
    patches: PatchItem[];
  };
  status: "OK" | string;
};

function PatchBlock({ text }: { text: string }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: "background.default",
        borderRadius: 2,
        p: 2,
        m: 0,
        fontSize: 13,
        overflowX: "auto",
        maxHeight: 480,
      }}
    >
      {text.split("\n").map((line, i) => {
        let color = "text.primary";
        if (line.startsWith("+")) color = "success.main";
        else if (line.startsWith("-")) color = "error.main";
        else if (line.startsWith("@@")) color = "info.main";
        return (
          <Box key={i} component="div" sx={{ color, whiteSpace: "pre" }}>
            {line}
          </Box>
        );
      })}
    </Box>
  );
}

type Props = {
  sectionID: number | string;
  homeworkID: number | string;
  studentEmail: string;
  filePath: string;
  pageSize?: number;
};

export default function FileDiffTimeline({
  sectionID,
  homeworkID,
  studentEmail,
  filePath,
  pageSize = 25,
}: Props) {
  const { user } = useAuth();
  const [patchesDesc, setPatchesDesc] = useState<PatchItem[]>([]);
  const [finalText, setFinalText] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIdxDesc, setActiveIdxDesc] = useState(0);
  const hasMore = useMemo(() => page * limit < total, [page, limit, total]);
  const fetchPage = async (whichPage: number, append = false) => {
    const qp = new URLSearchParams({
      section: String(sectionID),
      homework: String(homeworkID),
      student: studentEmail,
      file: filePath,
      page: String(whichPage),
      limit: String(limit),
    });

    const res = await fetch(`${API_BASE_URL}/build_file?${qp.toString()}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      },
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to load file diffs");
    }

    const totalStr = res.headers.get("X-Total-Count") ?? "0";
    const body: FileDiffsResponse = await res.json();

    
    if (append) {
      setPatchesDesc((prev) => [...prev, ...(body.data.patches || [])]);
    } else {
      setPatchesDesc(body.data.patches || []);
      setActiveIdxDesc(0);
    }
    setFinalText(body.data.finalText || "");
    setTotal(parseInt(totalStr, 10) || 0);
    setPage(whichPage);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchPage(1, false);
      } catch (e) {
        if (mounted)
          setError(
            e instanceof Error ? e.message : "Failed to load file diffs"
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sectionID, homeworkID, studentEmail, filePath, limit]);

  const activePatch = patchesDesc[activeIdxDesc];

  const activePatchNumber = total ? total - 1 - activeIdxDesc : activeIdxDesc;
  
  const createdAtLabel = (iso: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box
          sx={{
            width: { xs: "100%", md: 320 },
            pr: { md: 1 },
            maxHeight: 640,
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            History — {filePath}
          </Typography>
          {loading && patchesDesc.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : patchesDesc.length === 0 ? (
            <Typography color="text.secondary">No patches found.</Typography>
          ) : (
            <>
              <Timeline position="right" sx={{ m: 0, p: 0 }}>
                {patchesDesc.map((p, idx) => {
                  const selected = idx === activeIdxDesc;
                  return (
                    <TimelineItem
                      key={p.id}
                      sx={{ cursor: "pointer" }}
                      onClick={() => setActiveIdxDesc(idx)}
                    >
                      <TimelineSeparator>
                        <TimelineDot color={selected ? "primary" : "grey"} />
                        {idx < patchesDesc.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: 1 }}>
                        <Typography
                          variant="body1"
                          color="text.primary"
                          fontWeight={selected ? 700 : 500}
                        >
                          Patch {total ? total - 1 - idx:idx}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={activeIdxDesc >= patchesDesc.length - 1}
                  onClick={() =>
                    setActiveIdxDesc((i) =>
                      Math.min(patchesDesc.length - 1, i + 1)
                    )
                  }
                >
                  Older
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={activeIdxDesc === 0}
                  onClick={() => setActiveIdxDesc((i) => Math.max(0, i - 1))}
                >
                  Newer
                </Button>
                <Box flex={1} />
                <Button
                  variant="text"
                  size="small"
                  disabled={!hasMore || loadingMore}
                  onClick={async () => {
                    try {
                      setLoadingMore(true);
                      await fetchPage(page + 1, true);
                    } finally {
                      setLoadingMore(false);
                    }
                  }}
                >
                  {loadingMore
                    ? "Loading…"
                    : hasMore
                      ? "Load older"
                      : "No more"}
                </Button>
              </Stack>
            </>
          )}
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", md: "block" } }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {activePatch
              ? `Patch ${activePatchNumber} — ${createdAtLabel(
                  activePatch.createdAt
                )}`
              : "No patch selected"}
          </Typography>
          {activePatch ? (
            <PatchBlock text={activePatch.patchText || ""} />
          ) : null}

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              disabled={activeIdxDesc === 0}
              onClick={() => setActiveIdxDesc((i) => Math.max(0, i - 1))}
            >
              Newer
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={activeIdxDesc >= patchesDesc.length - 1}
              onClick={() =>
                setActiveIdxDesc((i) => Math.min(patchesDesc.length - 1, i + 1))
              }
            >
              Older
            </Button>
            <Box flex={1} />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
