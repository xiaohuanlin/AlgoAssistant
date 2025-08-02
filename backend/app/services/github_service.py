import hashlib
import os
import re
from typing import Any, Dict, List

from github import Github, GithubException, InputGitTreeElement

from app.schemas.github import GitHubConfig
from app.services.base_repo_service import BaseRepoService
from app.utils.rate_limiter import RedisRateLimiter


class GitHubService(BaseRepoService[GitHubConfig]):
    """GitHub integration service implementation (using PyGithub)."""

    def __init__(self, config: GitHubConfig):
        super().__init__(config)
        assert config.token is not None, "GitHub token is required"
        self._client = Github(config.token)
        user_hash = hashlib.sha256(config.token.encode()).hexdigest()
        self.limiter = RedisRateLimiter(f"github_rate_limit:{user_hash}")

    def _parse_repo_url(self, repo_url: str) -> str:
        """Parse repository URL to extract owner/repo format."""
        if not repo_url:
            raise Exception("Repository URL is required")

        # Handle different URL formats
        patterns = [
            r"https://github\.com/([^/]+/[^/]+?)(?:\.git)?/?$",  # https://github.com/owner/repo
            r"git@github\.com:([^/]+/[^/]+?)(?:\.git)?/?$",  # git@github.com:owner/repo
            r"^([^/]+/[^/]+)$",  # owner/repo
        ]

        for pattern in patterns:
            match = re.match(pattern, repo_url)
            if match:
                return match.group(1)

        raise Exception(f"Invalid repository URL format: {repo_url}")

    def _get_repo_full_name(self) -> str:
        """Get repository full name from config."""
        if not self.config.repo_url:
            raise Exception("Repository URL not configured")
        return self._parse_repo_url(self.config.repo_url)

    def _get_branch(self) -> str:
        """Get branch name from config."""
        return self.config.branch or "main"

    def test_connection(self) -> bool:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        try:
            user = self._client.get_user()
            _ = user.login
            return True
        except GithubException:
            return False

    def push_code(
        self,
        file_path: str,
        code: str,
        commit_message: str,
    ) -> str:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        repo_full_name = self._get_repo_full_name()
        branch = self._get_branch()
        try:
            repo = self._client.get_repo(repo_full_name)
            try:
                contents = repo.get_contents(file_path, ref=branch)
                sha = contents.sha
                result = repo.update_file(
                    file_path,
                    commit_message,
                    code,
                    sha,
                    branch=branch,
                )
            except GithubException:
                result = repo.create_file(
                    file_path,
                    commit_message,
                    code,
                    branch=branch,
                )
            return (
                result["commit"].html_url
                if isinstance(result, dict)
                else result[0].commit.html_url
            )
        except GithubException as e:
            raise Exception(f"Failed to push code to GitHub: {str(e)}")

    def push_files(
        self,
        files: List[Dict[str, str]],
        commit_message: str,
    ) -> str:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        repo_full_name = self._get_repo_full_name()
        branch = self._get_branch()
        try:
            repo = self._client.get_repo(repo_full_name)
            base_tree = repo.get_git_tree(sha=repo.get_branch(branch).commit.sha)
            elements = []
            for f in files:
                elements.append(
                    InputGitTreeElement(f["file_path"], "100644", "blob", f["code"])
                )
            tree = repo.create_git_tree(elements, base_tree)
            parent = repo.get_git_commit(repo.get_branch(branch).commit.sha)
            commit = repo.create_git_commit(commit_message, tree, [parent])
            repo.get_git_ref(f"heads/{branch}").edit(commit.sha)
            return commit.html_url if hasattr(commit, "html_url") else ""
        except GithubException as e:
            raise Exception(f"Failed to push files to GitHub: {str(e)}")

    def create_repository(self, repo_name: str, description: str = "") -> str:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        try:
            user = self._client.get_user()
            repo = user.create_repo(
                name=repo_name, description=description, private=False, auto_init=True
            )
            return repo.html_url
        except GithubException as e:
            raise Exception(f"Failed to create repository: {str(e)}")

    def list_repos(self) -> List[str]:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        return [repo.full_name for repo in self._client.get_user().get_repos()]

    def get_lastest_commit(self) -> str:
        self.limiter.wait_if_needed(0, 70, 60, "github")
        repo_full_name = self._get_repo_full_name()
        repo = self._client.get_repo(repo_full_name)
        return repo.get_commits()[0].commit.message
