from app import __version__


def test_version_shape() -> None:
    assert isinstance(__version__, str)
    assert len(__version__) > 0
