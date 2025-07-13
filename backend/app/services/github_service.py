import os
from typing import Any, Dict, List

from github import Github, GithubException, InputGitTreeElement

from app.schemas.github import GitHubConfig
from app.services.base_repo_service import BaseRepoService


class GitHubService(BaseRepoService):
    """GitHub integration service implementation (using PyGithub)."""

    def __init__(self, config: GitHubConfig):
        super().__init__(config)
        assert config.token is not None, "GitHub token is required"
        self._client = Github(config.token)

    def test_connection(self) -> bool:
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
        repo_config: Dict[str, Any],
    ) -> str:
        repo_full_name = repo_config.get("repo")
        if not repo_full_name or "/" not in repo_full_name:
            raise Exception("Invalid repository")
        try:
            repo = self._client.get_repo(repo_full_name)
            try:
                contents = repo.get_contents(
                    file_path, ref=repo_config.get("branch", "main")
                )
                sha = contents.sha
                result = repo.update_file(
                    file_path,
                    commit_message,
                    code,
                    sha,
                    branch=repo_config.get("branch", "main"),
                )
            except GithubException:
                result = repo.create_file(
                    file_path,
                    commit_message,
                    code,
                    branch=repo_config.get("branch", "main"),
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
        repo_config: Dict[str, Any],
        branch: str = "main",
    ) -> str:
        repo_full_name = repo_config.get("repo", "user/repo")
        if "/" not in repo_full_name:
            raise Exception("Invalid repository format. Expected 'owner/repo'")
        try:
            repo = self._client.get_repo(repo_full_name)
            base_tree = repo.get_git_tree(sha=repo.get_branch(branch).commit.sha)
            elements = []
            for f in files:
                elements.append(
                    InputGitTreeElement(f["file_path"], "100644", "blob", f["code"])
                )
            tree = repo.create_git_tree(elements, base_tree)
            parent = repo.get_branch(branch).commit
            commit = repo.create_git_commit(commit_message, tree, [parent])
            repo.get_git_ref(f"heads/{branch}").edit(commit.sha)
            return commit.html_url if hasattr(commit, "html_url") else ""
        except GithubException as e:
            raise Exception(f"Failed to push files to GitHub: {str(e)}")

    def create_repository(self, repo_name: str, description: str = "") -> str:
        try:
            user = self._client.get_user()
            repo = user.create_repo(
                name=repo_name, description=description, private=False, auto_init=True
            )
            return repo.html_url
        except GithubException as e:
            raise Exception(f"Failed to create repository: {str(e)}")

    def list_repos(self) -> List[str]:
        return [repo.full_name for repo in self._client.get_user().get_repos()]

    def get_lastest_commit(self, repo_config: Dict[str, Any]) -> str:
        repo_full_name = repo_config.get("repo")
        if not repo_full_name or "/" not in repo_full_name:
            raise Exception("Invalid repository")
        repo = self._client.get_repo(repo_full_name)
        return repo.get_commits()[0].sha
