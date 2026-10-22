import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader.jsx';
import { Spinner } from '../../../components/Spinner.jsx';
import { EmptyState, ErrorState } from '../../../components/EmptyState.jsx';
import { Badge } from '../../../components/Badge.jsx';
import { Field } from '../../../components/Field.jsx';
import { useCreateProject, useDeleteProject, useMyProjects } from '../api.js';

const EMPTY = { title: '', summary: '', techStack: '', gitHubUrl: '', demoUrl: '', achievements: '' };

function CreateProjectForm() {
  const create = useCreateProject();
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    await create.mutateAsync({
      title: form.title,
      summary: form.summary || null,
      techStack: form.techStack || null,
      gitHubUrl: form.gitHubUrl || null,
      demoUrl: form.demoUrl || null,
      achievements: form.achievements || null,
    });
    setForm(EMPTY);
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} type="button">
        + Add project
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card w-full space-y-4 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add project</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title" required value={form.title} onChange={set('title')} />
        <Field label="Tech stack" value={form.techStack} onChange={set('techStack')} placeholder="React, C#, SQL" />
        <Field label="GitHub URL" value={form.gitHubUrl} onChange={set('gitHubUrl')} placeholder="https://github.com/…" />
        <Field label="Demo URL" value={form.demoUrl} onChange={set('demoUrl')} placeholder="https://…" />
      </div>
      <Field label="Summary" as="textarea" rows={2} value={form.summary} onChange={set('summary')} />
      <Field label="Achievements" as="textarea" rows={2} value={form.achievements} onChange={set('achievements')} placeholder="Awards, recognition, impact…" />
      {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save project'}
        </button>
        <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProjectCard({ project, onDelete }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{project.title}</h3>
        <button className="text-xs text-red-600 hover:underline" onClick={() => onDelete(project.id)} type="button">
          Delete
        </button>
      </div>
      {project.summary && <p className="text-sm text-slate-600">{project.summary}</p>}
      {project.techStack && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.split(',').map((t) => (
            <Badge key={t.trim()} tone="brand">{t.trim()}</Badge>
          ))}
        </div>
      )}
      {project.achievements && <p className="text-xs text-slate-500">🏆 {project.achievements}</p>}
      <div className="mt-auto flex gap-4 text-sm">
        {project.gitHubUrl && (
          <a href={project.gitHubUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700">
            GitHub →
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700">
            Live demo →
          </a>
        )}
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const { data, isLoading, isError, error, refetch } = useMyProjects();
  const del = useDeleteProject();

  const onDelete = (id) => {
    if (window.confirm('Delete this project?')) del.mutate(id);
  };

  return (
    <div>
      <PageHeader
        title="My Projects"
        subtitle="Showcase your work with tech stack, source and demo links."
        actions={<CreateProjectForm />}
      />

      {isLoading ? (
        <Spinner label="Loading your projects…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState title="No projects yet" message="Add your first project to showcase it to the community." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <ProjectCard key={p.id} project={p} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
