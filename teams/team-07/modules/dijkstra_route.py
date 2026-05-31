import heapq

graph = {
    "Majestic": {
        "SilkBoard": 15,
        "Indiranagar": 12
    },

    "SilkBoard": {
        "BTM": 10,
        "Koramangala": 8
    },

    "Indiranagar": {
        "MG Road": 7
    },

    "MG Road": {
        "Koramangala": 9
    },

    "BTM": {
        "Koramangala": 4
    },

    "Koramangala": {}
}

def dijkstra(graph,start,end):

    pq=[(0,start,[])]

    visited=set()

    while pq:

        cost,node,path=heapq.heappop(pq)

        if node in visited:
            continue

        visited.add(node)

        path=path+[node]

        if node==end:
            return cost,path

        for neighbor,weight in graph[node].items():

            if neighbor not in visited:

                heapq.heappush(
                    pq,
                    (
                        cost+weight,
                        neighbor,
                        path
                    )
                )

    return None,None