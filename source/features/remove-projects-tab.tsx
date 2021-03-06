import React from 'dom-chef';
import select from 'select-dom';
import onetime from 'onetime';
import elementReady from 'element-ready';
import features from '../libs/features';
import {isUserProfile, isOwnOrganizationProfile, isOrganizationProfile} from '../libs/page-detect';

const addNewProjectLink = onetime(() => {
	if (isUserProfile()) {
		// The link already exists on our profile,
		// and we can't create projects on others' profiles
		return;
	}

	if (isOrganizationProfile() && !isOwnOrganizationProfile()) {
		// We can only add projects to our organizations
		return;
	}

	// We can't detect whether we can create projects on a repo,
	// so we're just gonna show a potentially-404 link. 🤷

	// URLs patterns:
	// https://github.com/orgs/USER/projects/new
	// https://github.com/USER/REPO/projects/new
	const path = location.pathname.split('/', 3);
	const base = path.length > 2 ? path.join('/') : '/orgs' + path.join('/');
	select('.Header [href="/new"]')!.parentElement!.append(
		<a className="dropdown-item" href={base + '/projects/new'}>
			New project
		</a>
	);
});

async function init(): Promise<false | void> {
	await elementReady(`
		.orghead + *,
		.repohead + *,
		.user-profile-nav + *
	`); // Wait for the tab bar to be loaded

	const projectsTab = select([
		'[data-hotkey="g b"]', // In organizations and repos
		'.user-profile-nav [href$="?tab=projects"]' // In user profiles
	].join());

	if (!projectsTab) {
		// Projects aren't enabled here
		return;
	}

	addNewProjectLink();

	// If there's a settings tab, the current user can disable the projects,
	// so the tab should not be hidden
	if (select.exists([
		'.js-repo-nav [data-selected-links^="repo_settings"]', // In repos
		'.pagehead-tabs-item[href$="/settings/profile"]' // In organizations
	].join())) {
		return;
	}

	// Only remove the tab if it's not the current page and if it has 0 projects
	if (!projectsTab.matches('.selected') && select('.Counter', projectsTab)!.textContent!.trim() === '0') {
		projectsTab.remove();
	}
}

features.add({
	id: __featureName__,
	description: 'Hide the "Projects" tab from repositories and profiles when there are no projects',
	include: [
		features.isRepo,
		features.isUserProfile,
		features.isOrganizationProfile
	],
	load: features.onAjaxedPages,
	init
});
