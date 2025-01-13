# GitOps Sharing

**Workshop: GitOps Pipeline Setup**

[https://github.com/huydq189/nextjs-example](https://github.com/huydq189/nextjs-example)

[https://github.com/huydq189/example-gitops](https://github.com/huydq189/example-gitops)

**Topics:**

- Google Cloud Platform (GCP) Setup
    - [https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage](https://cloud.google.com/billing/docs/how-to/notify#cap_disable_billing_to_stop_usage)
    - Artifact Registry configuration
    - Service Account management & permissions
- CI/CD Pipeline Implementation
    - CI
        - Lint
        - Unit test
        - SonarQube
        - Build
    - CD
        - Building and pushing container images
        - Commit GitOps repository
- Kubernetes & GitOps
    - Kustomize for K8s Manifest Management:
    
    https://kustomize.io/
    
    - Organize Kustomize folder structure with `base` and `overlays`.
    - Define `kustomization.yaml` for image references and environment overlays.
    - ArgoCD deployment and configuration
    
    https://argo-cd.readthedocs.io/en/stable/
    
    - Install Minikube & kubectl
    - `minikube start`
    - Install ArgoCD
    
    ```bash
    # create the namespace
    $ kubectl create namespace argocd
    
    # apply the installation manifest
    $ kubectl apply \
        --namespace argocd \
        --filename https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    # wait for everything to be launched and running
    $ watch kubectl get all --namespace argocd
    NAME                                     READY   STATUS    RESTARTS   AGE
    pod/argocd-application-controller-0      1/1     Running   0          100s
    pod/argocd-dex-server-59d44b9f99-8kp7d   1/1     Running   0          100s
    pod/argocd-redis-79bdbdf78f-247q5        1/1     Running   0          100s
    pod/argocd-repo-server-b6f8cdc6f-4m8h5   1/1     Running   0          100s
    pod/argocd-server-bdc697879-rdk89        1/1     Running   0          100s
    
    NAME                            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
    service/argocd-dex-server       ClusterIP   10.100.46.74    <none>        5556/TCP,5557/TCP,5558/TCP   100s
    service/argocd-metrics          ClusterIP   10.98.170.62    <none>        8082/TCP                     100s
    service/argocd-redis            ClusterIP   10.102.83.160   <none>        6379/TCP                     100s
    service/argocd-repo-server      ClusterIP   10.96.100.93    <none>        8081/TCP,8084/TCP            100s
    service/argocd-server           ClusterIP   10.96.151.61    <none>        80/TCP,443/TCP               100s
    service/argocd-server-metrics   ClusterIP   10.102.166.2    <none>        8083/TCP                     100s
    
    NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
    deployment.apps/argocd-dex-server    1/1     1            1           100s
    deployment.apps/argocd-redis         1/1     1            1           100s
    deployment.apps/argocd-repo-server   1/1     1            1           100s
    deployment.apps/argocd-server        1/1     1            1           100s
    
    NAME                                           DESIRED   CURRENT   READY   AGE
    replicaset.apps/argocd-dex-server-59d44b9f99   1         1         1       100s
    replicaset.apps/argocd-redis-79bdbdf78f        1         1         1       100s
    replicaset.apps/argocd-repo-server-b6f8cdc6f   1         1         1       100s
    replicaset.apps/argocd-server-bdc697879        1         1         1       100s
    
    NAME                                             READY   AGE
    statefulset.apps/argocd-application-controller   1/1     100s
    ```
    
    - Forward port to access argoCD interface
    
    ```bash
    kubectl port-forward \
    --namespace argocd \
    svc/argocd-server 8000:443
    Forwarding from 127.0.0.1:8000 -> 8080
    Forwarding from [::1]:8000 -> 8080
    ```
    
    - Open your browser and navigate to [**https://localhost:8000**](https://localhost:8000/) to login
    - Login with admin user and get the password using this command:
        
        ```bash
        	# get admin password
        	$ kubectl get secret argocd-initial-admin-secret \
        	    --namespace argocd \
        	    --output jsonpath="{.data.password}" \
        	    | base64 --decode \
        	    && echo
        ```
        
    - Connect to **private repository**
    - Create an **SSH key**
        
        ```bash
        ssh-keygen -t ed25519 -f ~/.ssh/argocd-local.pem
        Enter passphrase (empty for no passphrase): # <press-enter>
        Enter same passphrase again: # <press-enter>
        Your identification has been saved in /home/xxxxx/.ssh/argocd-local.pem
        Your public key has been saved in /home/xxxxx/.ssh/argocd-local.pem.pub
        ```
        
    - Rename `argocd-test.pem.pub` to `argocd-test.pub`
        
        ```bash
        $ mv ~/.ssh/argocd-local.pem.pub ~/.ssh/argocd-local.pub
        ```
        
    - Open **public key** and **copy-paste**:
        
        ```bash
        $ cat ~/.ssh/argocd-test.pub
        ssh-ed25519 AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx username@computer
        ```
        
    - Open **private key** and **copy-paste**:
        
        ```bash
        cat ~/.ssh/argocd-test.pem
        -----BEGIN OPENSSH PRIVATE KEY-----
        b3Blxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQFBgc=
        -----END OPENSSH PRIVATE KEY-----
        ```
        
    
    Deploy an application with **Argo CD:**
    
    - kubectl apply path/overlays/dev
    - Add repository using yaml config argocd
    
    ```yaml
    apiVersion: argoproj.io/v1alpha1
    kind: Application
    metadata:
      name: nextjs-example
      namespace: argocd  # ArgoCD's namespace (default is "argocd")
    spec:
      destination:
        name: ''
        namespace: dev-env  # The namespace where your app will be deployed (e.g., dev-env)
        server: https://kubernetes.default.svc  # Use the default cluster URL (inside the cluster)
      source:
        repoURL: 'git@github.com:huydq189/example-gitops.git'  # Your Git repository URL
        path: nextjs-example/overlays/dev  # Path to the Kustomize overlay
        targetRevision: HEAD  # Git branch or commit hash to track
      project: default  # The ArgoCD project (default is "default")
      syncPolicy:
        automated:
          prune: true  # Automatically delete resources no longer in the Git repo
          selfHeal: true  # Automatically sync and fix discrepancies
        syncOptions:
          - CreateNamespace=true  # Create the namespace if it doesn't exist
    ```
    

### **Top-Level Options:**

These options control the overall behavior of the synchronization process:

1. **PRUNE**
    - **What it does:** Deletes resources from the cluster that are no longer defined in the Git repository.
    - **Use case:** Clean up outdated resources after a sync.
2. **DRY RUN**
    - **What it does:** Simulates the synchronization without making actual changes in the cluster.
    - **Use case:** Useful for testing changes before applying them.
3. **APPLY ONLY**
    - **What it does:** Applies the manifests but skips some sync operations like pruning.
    - **Use case:** Apply changes but avoid deleting existing resources.
4. **FORCE**
    - **What it does:** Forces the sync even if there are warnings or errors (like immutable fields).
    - **Use case:** Resolve conflicts or force re-deployments.

---

### **SYNC OPTIONS:**

These options allow fine-tuning of how the synchronization process handles resources:

1. **SKIP SCHEMA VALIDATION**
    - **What it does:** Disables schema validation checks on Kubernetes manifests.
    - **Use case:** Use when working with custom CRDs or incomplete schema definitions.
2. **AUTO CREATE NAMESPACE**
    - **What it does:** Automatically creates the namespace if it doesn't exist in the cluster.
    - **Use case:** Deploying applications into new namespaces without manual creation.
3. **PRUNE LAST**
    - **What it does:** Deletes resources no longer in the Git repository **after** all resources are applied.
    - **Use case:** Ensures new resources are created before old ones are removed to avoid disruption.
4. **APPLY OUT OF SYNC ONLY**
    - **What it does:** Only applies changes to resources that are out of sync (not all resources).
    - **Use case:** When you want to avoid unnecessary re-application of unchanged resources.
5. **RESPECT IGNORE DIFFERENCES**
    - **What it does:** Ignores changes specified in `ignoreDifferences` configuration (like timestamps or metadata).
    - **Use case:** Avoid triggering syncs for fields that are irrelevant for your deployment strategy.
6. **SERVER SIDE APPLY**
    - **What it does:** Uses Kubernetes **server-side apply** instead of the standard client-side apply (`kubectl apply`).
    - **Use case:** Useful for large manifests or declarative resource management.

---

### **PRUNE PROPAGATION POLICY:**

This option controls how resources are deleted during pruning. Options include:

- **Foreground:** Deletes resources **immediately** and waits for completion.
- **Background:** Marks resources for deletion but doesn't wait for completion.
- **Orphan:** Deletes the resource without affecting its dependents.

---

### **REPLACE:**

- **What it does:** Deletes and recreates resources instead of applying updates in place.
- **Use case:** Use when the resource has immutable fields that need changes.

---

### **RETRY:**

- **What it does:** Retries the synchronization process if it fails.
- **Use case:** Useful for handling transient errors during sync.

---

### **SYNCHRONIZE RESOURCES:**

This section lets you selectively choose which resources to sync.

- **Blue resources:** Resources in sync.
- **Yellow warning:** Resources with potential issues or requiring attention.

---

### **Best Practices:**

- ✅ **Use `AUTO CREATE NAMESPACE`** for new environments.
- ✅ **Enable `PRUNE`** to avoid resource drift.
- ✅ **Test with `DRY RUN`** before applying critical changes.
- ✅ **Use `SERVER SIDE APPLY`** for complex manifests or large configurations.

# **Assessment**:

- Implement test-env for your minikube cluster
- Add secret to kustomize manifest and use it in the source code
- Optional: **Persistent Volume (PV) & Persistent Volume Claim (PVC)**
