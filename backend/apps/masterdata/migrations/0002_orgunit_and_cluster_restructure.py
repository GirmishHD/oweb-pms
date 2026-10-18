# Generated manually for Org Unit Restructure to Region -> Cluster -> Woreda -> Kebele
from django.db import migrations, models
import django.db.models.deletion

CLUSTERS_DATA = [
    {
        'id': 'clust-eastern',
        'code': 'CLUST_BAHA_OROMIYAA',
        'name': 'Eastern Oromia',
        'local_name': 'Baha Oromiyaa',
        'former_zones': ['East Hararghe', 'West Hararghe'],
        'description': 'Eastern regional cluster encompassing East and West Hararghe watershed corridors.'
    },
    {
        'id': 'clust-southeastern',
        'code': 'CLUST_KIBBA_BAHA_OROMIYAA',
        'name': 'Southeastern Oromia',
        'local_name': 'Kibba Baha Oromiyaa',
        'former_zones': ['Arsi', 'West Arsi', 'Bale', 'East Bale'],
        'description': 'Southeastern regional cluster covering Arsi, West Arsi, Bale, and East Bale basins.'
    },
    {
        'id': 'clust-southern',
        'code': 'CLUST_KIBBA_OROMIYAA',
        'name': 'Southern Oromia',
        'local_name': 'Kibba Oromiyaa',
        'former_zones': ['Borena', 'East Borena', 'Guji', 'West Guji'],
        'description': 'Southern pastoralist and rangelands cluster covering Borena, East Borena, Guji, and West Guji.'
    },
    {
        'id': 'clust-southwestern',
        'code': 'CLUST_KIBBA_LIXA_OROMIYAA',
        'name': 'Southwestern Oromia',
        'local_name': 'Kibba Lixa Oromiyaa',
        'former_zones': ['Buno Bedele', 'Illubabor', 'Jimma'],
        'description': 'Southwestern highland rainforest and headwaters cluster covering Buno Bedele, Illubabor, and Jimma.'
    },
    {
        'id': 'clust-western',
        'code': 'CLUST_LIXA_OROMIYAA',
        'name': 'Western Oromia',
        'local_name': 'Lixa Oromiyaa',
        'former_zones': ['Horo Guduru Wollega', 'Kellem Wollega', 'East Wollega', 'West Wollega', 'Horo Guduru Welega', 'Kelam Welega', 'East Welega', 'West Welega'],
        'description': 'Western regional cluster covering Horo Guduru, Kellem, East, and West Wollega.'
    },
    {
        'id': 'clust-central',
        'code': 'CLUST_GIDDU_GALEESSA_OROMIYAA',
        'name': 'Central Oromia',
        'local_name': 'Giddu Galeessa Oromiyaa',
        'former_zones': ['East Shewa', 'North Shewa', 'Southwest Shewa', 'West Shewa'],
        'description': 'Central regional administrative cluster covering East Shewa, North Shewa, Southwest Shewa, and West Shewa.'
    }
]

TOWNS_DATA = [
    # Southeastern
    {'id': 'town-asella', 'code': 'TWN_ASELLA', 'name': 'Asella', 'local_name': 'Magaalaa Asallaa', 'cluster_id': 'clust-southeastern', 'former_zone': 'Arsi', 'classification': 'City Administration'},
    {'id': 'town-dodola', 'code': 'TWN_DODOLA', 'name': 'Dodola', 'local_name': 'Magaalaa Dodolaa', 'cluster_id': 'clust-southeastern', 'former_zone': 'West Arsi', 'classification': 'City Administration'},
    # Southern
    {'id': 'town-bule-hora', 'code': 'TWN_BULE_HORA', 'name': 'Bule Hora', 'local_name': 'Magaalaa Bulee Horaa', 'cluster_id': 'clust-southern', 'former_zone': 'West Guji', 'classification': 'City Administration'},
    {'id': 'town-moyale', 'code': 'TWN_MOYALE', 'name': 'Moyale', 'local_name': 'Magaalaa Moyyaalee', 'cluster_id': 'clust-southern', 'former_zone': 'Borena', 'classification': 'City Administration'},
    {'id': 'town-shakiso', 'code': 'TWN_SHAKISO', 'name': 'Shakiso', 'local_name': 'Magaalaa Saakkisoo', 'cluster_id': 'clust-southern', 'former_zone': 'Guji', 'classification': 'City Administration'},
    # Southwestern
    {'id': 'town-agaro', 'code': 'TWN_AGARO', 'name': 'Agaro', 'local_name': 'Magaalaa Aggaaroo', 'cluster_id': 'clust-southwestern', 'former_zone': 'Jimma', 'classification': 'City Administration'},
    {'id': 'town-mattu', 'code': 'TWN_MATTU', 'name': 'Mattu', 'local_name': 'Magaalaa Mattuu', 'cluster_id': 'clust-southwestern', 'former_zone': 'Illubabor', 'classification': 'City Administration'},
    # Western
    {'id': 'town-nejo', 'code': 'TWN_NEJO', 'name': 'Nejo', 'local_name': 'Magaalaa Najjoo', 'cluster_id': 'clust-western', 'former_zone': 'West Wollega', 'classification': 'City Administration'},
    # Central
    {'id': 'town-ambo', 'code': 'TWN_AMBO', 'name': 'Ambo', 'local_name': 'Magaalaa Amboo', 'cluster_id': 'clust-central', 'former_zone': 'West Shewa', 'classification': 'City Administration'},
    {'id': 'town-batu', 'code': 'TWN_BATU', 'name': 'Batu', 'local_name': 'Magaalaa Baatuu', 'cluster_id': 'clust-central', 'former_zone': 'East Shewa', 'classification': 'City Administration'},
    {'id': 'town-holeta', 'code': 'TWN_HOLETA', 'name': 'Holeta', 'local_name': 'Magaalaa Hoolotaa', 'cluster_id': 'clust-central', 'former_zone': 'West Shewa', 'classification': 'City Administration'},
    {'id': 'town-mojo', 'code': 'TWN_MOJO', 'name': 'Mojo', 'local_name': 'Magaalaa Moojoo', 'cluster_id': 'clust-central', 'former_zone': 'East Shewa', 'classification': 'City Administration'},
    {'id': 'town-sandafa-bakkee', 'code': 'TWN_SANDAFA_BAKKEE', 'name': 'Sandafa Bakkee', 'local_name': 'Magaalaa Sandafaa Bakkee', 'cluster_id': 'clust-central', 'former_zone': 'North Shewa', 'classification': 'City Administration'},
    {'id': 'town-sheno', 'code': 'TWN_SHENO', 'name': 'Sheno', 'local_name': 'Magaalaa Shenoo', 'cluster_id': 'clust-central', 'former_zone': 'North Shewa', 'classification': 'City Administration'},
    {'id': 'town-waliso', 'code': 'TWN_WALISO', 'name': 'Waliso', 'local_name': 'Magaalaa Walisoo', 'cluster_id': 'clust-central', 'former_zone': 'Southwest Shewa', 'classification': 'City Administration'}
]

def migrate_to_clusters(apps, schema_editor):
    OrgUnit = apps.get_model('masterdata', 'OrgUnit')
    MasterDataStore = apps.get_model('masterdata', 'MasterDataStore')

    # 1. Create or update Region
    region, _ = OrgUnit.objects.update_or_create(
        id='reg-oromia',
        defaults={
            'code': 'REG_OROMIA',
            'name': 'Oromia National Regional State',
            'local_name': 'Mootummaa Naannoo Oromiyaa',
            'unit_type': 'REGION',
            'classification': 'National Regional State',
            'parent': None,
            'cluster': None,
            'status': 'Active',
            'description': 'Primary administrative jurisdiction for Oromia Water Resource Bureau (OWEB).'
        }
    )

    # 2. Create the Six Clusters under Region
    cluster_objs = {}
    zone_to_cluster_map = {}
    for cdata in CLUSTERS_DATA:
        c_obj, _ = OrgUnit.objects.update_or_create(
            id=cdata['id'],
            defaults={
                'code': cdata['code'],
                'name': cdata['name'],
                'local_name': cdata['local_name'],
                'unit_type': 'CLUSTER',
                'classification': 'Regional Administrative Cluster',
                'parent': region,
                'cluster': None,
                'status': 'Active',
                'description': cdata['description']
            }
        )
        c_obj.cluster = c_obj
        c_obj.save()
        cluster_objs[cdata['id']] = c_obj
        for z in cdata['former_zones']:
            zone_to_cluster_map[z.lower()] = c_obj

    # 3. Create Towns / City Administrations as TOWN unit_type directly under their Cluster
    town_objs = {}
    for tdata in TOWNS_DATA:
        cl_obj = cluster_objs.get(tdata['cluster_id'])
        t_obj, _ = OrgUnit.objects.update_or_create(
            id=tdata['id'],
            defaults={
                'code': tdata['code'],
                'name': tdata['name'],
                'local_name': tdata['local_name'],
                'unit_type': 'TOWN',
                'classification': tdata['classification'],
                'parent': cl_obj,
                'cluster': cl_obj,
                'former_zone_name': tdata['former_zone'],
                'status': 'Active',
                'description': f"{tdata['classification']} situated within {cl_obj.name} ({tdata['former_zone']})."
            }
        )
        town_objs[tdata['id']] = t_obj

    # 4. Migrate Woredas from MasterDataStore or seed defaults
    store = MasterDataStore.objects.last()
    existing_woredas = store.woredas if store and store.woredas else []
    
    # Standard woreda catalog mapping
    for w in existing_woredas:
        wid = w.get('id') or f"wor-{w.get('name', 'item').lower().replace(' ', '-')}"
        wname = w.get('name', 'Woreda')
        wzone = w.get('zone', '')
        # Map former zone to cluster
        assigned_cluster = zone_to_cluster_map.get(wzone.lower()) or cluster_objs.get('clust-central')
        
        w_obj, _ = OrgUnit.objects.update_or_create(
            id=wid,
            defaults={
                'code': w.get('code') or f"WOR_{wname.upper().replace(' ', '_').replace('/', '_')}",
                'name': wname,
                'local_name': w.get('localName', ''),
                'unit_type': 'WOREDA',
                'classification': 'Administrative Woreda',
                'parent': assigned_cluster,
                'cluster': assigned_cluster,
                'former_zone_name': wzone,
                'status': w.get('status', 'Active'),
                'description': w.get('description', f"Administrative woreda under {assigned_cluster.name}.")
            }
        )

    # 5. Migrate Kebeles
    existing_kebeles = store.kebeles if store and store.kebeles else []
    for k in existing_kebeles:
        kid = k.get('id') or f"keb-{k.get('name', 'item').lower().replace(' ', '-')}"
        kname = k.get('name', 'Kebele')
        kworeda_id = k.get('woredaId') or k.get('parentId')
        
        parent_unit = None
        if kworeda_id:
            parent_unit = OrgUnit.objects.filter(id=kworeda_id).first()
        if not parent_unit:
            # fallback to first woreda
            parent_unit = OrgUnit.objects.filter(unit_type__in=['WOREDA', 'TOWN']).first()

        cl_unit = parent_unit.cluster if parent_unit else None

        OrgUnit.objects.update_or_create(
            id=kid,
            defaults={
                'code': k.get('code') or f"KEB_{kid.upper().replace('-', '_')}",
                'name': kname,
                'local_name': k.get('localName', ''),
                'unit_type': 'KEBELE',
                'classification': 'Kebele Administration',
                'parent': parent_unit,
                'cluster': cl_unit,
                'status': k.get('status', 'Active'),
                'description': k.get('description', f"Kebele under {parent_unit.name if parent_unit else 'Cluster'}.")
            }
        )

    # 6. Synchronize back to MasterDataStore
    if not store:
        store = MasterDataStore.objects.create(version='2.1.0', last_pushed_by='system_migration')

    # Build cluster list for MasterDataStore
    clusters_json = [
        {
            'id': c.id,
            'code': c.code,
            'name': c.name,
            'localName': c.local_name,
            'regionId': region.id,
            'status': c.status,
            'description': c.description
        } for c in OrgUnit.objects.filter(unit_type='CLUSTER')
    ]

    towns_json = [
        {
            'id': t.id,
            'code': t.code,
            'name': t.name,
            'localName': t.local_name,
            'clusterId': t.cluster_id,
            'clusterName': t.cluster.name if t.cluster else '',
            'formerZone': t.former_zone_name,
            'classification': t.classification,
            'status': t.status,
            'description': t.description
        } for t in OrgUnit.objects.filter(unit_type='TOWN')
    ]

    woredas_json = [
        {
            'id': w.id,
            'code': w.code,
            'name': w.name,
            'localName': w.local_name,
            'clusterId': w.cluster_id,
            'clusterName': w.cluster.name if w.cluster else '',
            'formerZone': w.former_zone_name,
            'regionId': region.id,
            'status': w.status,
            'description': w.description
        } for w in OrgUnit.objects.filter(unit_type='WOREDA')
    ]

    kebeles_json = [
        {
            'id': k.id,
            'code': k.code,
            'name': k.name,
            'localName': k.local_name,
            'woredaId': k.parent_id,
            'woredaName': k.parent.name if k.parent else '',
            'status': k.status,
            'description': k.description
        } for k in OrgUnit.objects.filter(unit_type='KEBELE')
    ]

    # Geographic hierarchy mapped by Cluster
    geo_hierarchy = {}
    for c in OrgUnit.objects.filter(unit_type='CLUSTER'):
        units_under_cluster = list(OrgUnit.objects.filter(cluster=c, unit_type__in=['WOREDA', 'TOWN']).values_list('name', flat=True))
        geo_hierarchy[c.name] = units_under_cluster

    store.clusters = clusters_json
    store.towns = towns_json
    store.woredas = woredas_json
    store.kebeles = kebeles_json
    store.geographic_hierarchy = geo_hierarchy
    store.change_notes = "Restructured Organizational Hierarchy to Region -> Cluster -> Woreda / Town -> Kebele"
    store.save()


def rollback_clusters(apps, schema_editor):
    OrgUnit = apps.get_model('masterdata', 'OrgUnit')
    OrgUnit.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('masterdata', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='masterdatastore',
            name='clusters',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='masterdatastore',
            name='towns',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.CreateModel(
            name='OrgUnit',
            fields=[
                ('id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=100, unique=True)),
                ('name', models.CharField(max_length=255)),
                ('local_name', models.CharField(blank=True, max_length=255)),
                ('unit_type', models.CharField(choices=[('REGION', 'Region'), ('CLUSTER', 'Cluster'), ('WOREDA', 'Woreda'), ('TOWN', 'Town / City Administration'), ('KEBELE', 'Kebele')], max_length=50)),
                ('classification', models.CharField(blank=True, max_length=100)),
                ('former_zone_name', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(default='Active', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cluster', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cluster_units', to='masterdata.orgunit')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='children', to='masterdata.orgunit')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddIndex(
            model_name='orgunit',
            index=models.Index(fields=['unit_type', 'status'], name='masterdata__unit_ty_2b69cb_idx'),
        ),
        migrations.AddIndex(
            model_name='orgunit',
            index=models.Index(fields=['parent'], name='masterdata__parent__2845ef_idx'),
        ),
        migrations.AddIndex(
            model_name='orgunit',
            index=models.Index(fields=['cluster'], name='masterdata__cluster_12ad9b_idx'),
        ),
        migrations.RunPython(migrate_to_clusters, reverse_code=rollback_clusters),
    ]
