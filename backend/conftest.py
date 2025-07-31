"""Global test configuration for filtering warnings."""

import warnings

# Filter out the passlib crypt deprecation warning
warnings.filterwarnings(
    "ignore", message=".*crypt.*deprecated.*", category=DeprecationWarning
)
