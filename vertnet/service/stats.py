"""Stats request handlers, RPC services, APIs, and associated stuff."""

from protorpc import remote
from protorpc.wsgi import service
from protorpc.message_types import VoidMessage

from vertnet.service.model import Stats, StatsPayload

class StatsRPC(remote.Service):
    """Organization RPC service."""

    @remote.method(VoidMessage, StatsPayload)
    def get(self, message):
        """Get stats."""
        stats = Stats.query().get()
        if not stats: # Hack to create dummy stats.
            stats = Stats()
            stats.put()
        return stats.message

# RPC service endpoint.
rpc = service.service_mappings([('/api/stats', StatsRPC),],)
