"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Stack,
  Tooltip,
} from "@mui/material";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import FileDiffTimeline from "@/components/FileDiffTimeline";

type StudentOption = {
  id: number;
  email: string;
  name: string;
  surname: string;
  patchCount: number;
  flagCount: number;
};

type FileOption = {
  filePath: string;
  patchCount: number;
  flagCount: number;
  lastUpdated?: string;
};

type Props = {
  sectionID: number | string;
  homeworkID: number | string;
};

export default function StudentFileTimelinePanel({
  sectionID,
  homeworkID,
}: Props) {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [student, setStudent] = useState<StudentOption | null>(null);

  const [files, setFiles] = useState<FileOption[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [file, setFile] = useState<FileOption | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingStudents(true);
      setStudent(null);
      setFile(null);
      setFiles([]);
      try {
        const url = `${API_BASE_URL}/homework/students?section=${sectionID}&homework=${homeworkID}&withActivity=1`;
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        if (!cancel) setStudents(body?.data ?? []);
      } catch (e) {
        if (!cancel) setStudents([]);
      } finally {
        if (!cancel) setLoadingStudents(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [sectionID, homeworkID, user?.token]);

  useEffect(() => {
    if (!student) {
      setFiles([]);
      setFile(null);
      return;
    }
    let cancel = false;
    (async () => {
      setLoadingFiles(true);
      setFile(null);
      try {
        const url = `${API_BASE_URL}/homework/files?section=${sectionID}&homework=${homeworkID}&student=${encodeURIComponent(
          student.email
        )}&flaggedOnly=0`;
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(await res.text());
        const body = await res.json();
        if (!cancel) setFiles(body?.data ?? []);
      } catch (e) {
        if (!cancel) setFiles([]);
      } finally {
        if (!cancel) setLoadingFiles(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [student, sectionID, homeworkID, user?.token]);

  const studentLabel = (s: StudentOption) =>
    `${s.name || ""} ${s.surname || ""}`.trim() || s.email;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, overflow: "hidden", mt: 3 }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Explore timeline by student & file
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Autocomplete<StudentOption>
              options={students}
              loading={loadingStudents}
              value={student}
              onChange={(_, v) => setStudent(v)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              getOptionLabel={studentLabel}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select student"
                  placeholder="Type to search…"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingStudents ? (
                          <CircularProgress size={18} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>{studentLabel(option)}</Typography>
                    <Chip size="small" label={`${option.patchCount} patches`} />
                    {option.flagCount > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        label={`${option.flagCount} flags`}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Stack>
                </li>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Autocomplete<FileOption>
              options={files}
              loading={loadingFiles}
              value={file}
              onChange={(_, v) => setFile(v)}
              isOptionEqualToValue={(a, b) => a.filePath === b.filePath}
              getOptionLabel={(f) => f?.filePath ?? ""}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select file"
                  placeholder={
                    student ? "Choose a file…" : "Select a student first"
                  }
                  disabled={!student}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingFiles ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.filePath}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      sx={{
                        maxWidth: 420,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {option.filePath}
                    </Typography>
                    <Chip size="small" label={`${option.patchCount} patches`} />
                    {option.flagCount > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        label={`${option.flagCount} flags`}
                      />
                    )}
                    {option.lastUpdated && (
                      <Tooltip
                        title={new Date(option.lastUpdated).toISOString()}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(option.lastUpdated))}
                        </Typography>
                      </Tooltip>
                    )}
                  </Stack>
                </li>
              )}
            />
          </Grid>
        </Grid>

        {student && file && (
          <Box sx={{ mt: 3 }}>
            <FileDiffTimeline
              sectionID={sectionID}
              homeworkID={homeworkID}
              studentEmail={student.email}
              filePath={file.filePath}
              pageSize={25}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
