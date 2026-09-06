(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderPreview(project) {
    if (project.image) {
      return `
        <img src="${escapeHtml(project.image)}" alt="Preview ${escapeHtml(project.title)}" class="project-preview-img">
      `;
    }

    return `
      <div class="crt-screen-mini flex flex-col items-center justify-center p-4 text-center">
        <span class="text-3xl mb-1">${escapeHtml(project.previewIcon)}</span>
        <span class="text-neon-green text-sm">[ ${escapeHtml(project.previewTitle)} ]</span>
        <span class="text-xs text-gray-400 mt-1">${escapeHtml(project.previewSubtitle)}</span>
      </div>
    `;
  }

  function renderProject(project) {
    const technologies = project.technologies.map((tech) => `
      <span class="bg-black px-2 py-0.5 border border-win95-gray">${escapeHtml(tech)}</span>
    `).join('');

    const links = [
      project.githubUrl ? {
        href: project.githubUrl,
        label: project.linkLabel || 'GitHub Repo',
        icon: project.linkIcon || '🔗',
      } : null,
      project.liveDemoUrl ? {
        href: project.liveDemoUrl,
        label: 'Live Demo',
        icon: '🚀',
      } : null,
    ].filter(Boolean).map((link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" class="win95-action-btn text-sm py-1 px-4 text-black font-bold">
        ${escapeHtml(link.icon)} ${escapeHtml(link.label)}
      </a>
    `).join('');

    return `
      <div class="project-card" data-status="${escapeHtml(project.status)}" data-featured="${project.featured ? 'true' : 'false'}">
        <div class="project-preview">
          ${renderPreview(project)}
        </div>
        <div class="project-info">
          <div class="project-card-header flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">💾</span>
              <span class="text-neon-cyan font-bold text-lg">${escapeHtml(project.title)}</span>
            </div>
            <span class="text-xs ${escapeHtml(project.categoryClass)} border px-2 py-0.5">${escapeHtml(project.category)}</span>
          </div>
          <p class="text-sm text-gray-300 mb-4 leading-relaxed">${escapeHtml(project.description)}</p>
          <div class="flex flex-wrap gap-1 mb-4 text-xs text-neon-green">${technologies}</div>
          <div class="flex gap-2">${links}</div>
        </div>
      </div>
    `;
  }

  async function initProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    try {
      const response = await fetch(grid.dataset.source || 'data/projects.json');
      if (!response.ok) throw new Error(`Failed to load projects: ${response.status}`);
      const projects = await response.json();
      grid.innerHTML = projects.map(renderProject).join('');
    } catch (error) {
      console.error(error);
      grid.innerHTML = '<p class="text-gray-300 readable-text">Project data failed to load.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', initProjects);
})();
